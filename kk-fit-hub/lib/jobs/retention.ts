import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Db = SupabaseClient<Database>;
const BUCKET = "applicant-files";
const day = 86_400_000;

/**
 * Retention (PRD 14.5; CONFIRM periods with a lawyer):
 *  - declined applications: documents deleted after 6 months, records after 12 (delete_after);
 *  - inquiries marked lost or closed: anonymised after 24 months.
 */
export const RETENTION = { declinedFilesMonths: 6, inquiryAnonymiseMonths: 24 };

export async function runRetention(db: Db, now = Date.now()) {
  const report = { filesDeleted: 0, applicationsDeleted: 0, inquiriesAnonymised: 0 };

  // 1. Documents of applications declined more than 6 months ago.
  const filesCutoff = new Date(now - RETENTION.declinedFilesMonths * 30.44 * day).toISOString();
  const { data: oldDeclined } = await db
    .from("applications")
    .select("id, application_files(id, storage_path)")
    .eq("status", "declined")
    .lt("decided_at", filesCutoff);
  for (const app of oldDeclined ?? []) {
    const paths = app.application_files.map((f) => f.storage_path);
    if (paths.length === 0) continue;
    const { error } = await db.storage.from(BUCKET).remove(paths);
    if (error) continue;
    await db.from("application_files").delete().eq("application_id", app.id);
    report.filesDeleted += paths.length;
  }

  // 2. Declined application records past their retention date.
  const today = new Date(now + 3 * 3600_000).toISOString().slice(0, 10);
  const { data: expired } = await db
    .from("applications")
    .select("id, application_files(storage_path)")
    .eq("status", "declined")
    .lt("delete_after", today);
  for (const app of expired ?? []) {
    const paths = app.application_files.map((f) => f.storage_path);
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
    await db.from("notes").delete().eq("entity_type", "application").eq("entity_id", app.id);
    const { error } = await db.from("applications").delete().eq("id", app.id);
    if (!error) report.applicationsDeleted += 1;
  }

  // 3. Lost or closed inquiries not touched for 24 months: anonymise.
  const anonCutoff = new Date(now - RETENTION.inquiryAnonymiseMonths * 30.44 * day).toISOString();
  const { data: stale } = await db
    .from("inquiries")
    .select("id")
    .in("status", ["lost", "closed"])
    .is("anonymised_at", null)
    .lt("updated_at", anonCutoff);
  for (const inq of stale ?? []) {
    const { error } = await db
      .from("inquiries")
      .update({
        contact_name: "Anonymised",
        contact_role: null,
        phone_e164: null,
        email: null,
        message: null,
        county_other: null,
        utm: {},
        anonymised_at: new Date(now).toISOString(),
      })
      .eq("id", inq.id);
    if (!error) {
      await db.from("notes").delete().eq("entity_type", "inquiry").eq("entity_id", inq.id);
      report.inquiriesAnonymised += 1;
    }
  }
  return report;
}

/**
 * Orphaned uploads (PRD 8.2): files under pending/ older than 48 hours, and
 * files under applications/ that no application_files row points to.
 */
export async function cleanUploads(db: Db, now = Date.now()) {
  const cutoff = now - 48 * 3600_000;
  let removed = 0;
  const storage = db.storage.from(BUCKET);
  const { data: attached } = await db.from("application_files").select("storage_path");
  const keep = new Set((attached ?? []).map((f) => f.storage_path));

  for (const root of ["pending", "applications"]) {
    const { data: folders } = await storage.list(root, { limit: 1000 });
    for (const folder of folders ?? []) {
      if (folder.id) continue; // a file at the root, not a folder
      const prefix = `${root}/${folder.name}`;
      const { data: files } = await storage.list(prefix, { limit: 1000 });
      const stale = (files ?? [])
        .filter((f) => f.id && new Date(f.created_at ?? 0).getTime() < cutoff)
        .map((f) => `${prefix}/${f.name}`)
        .filter((p) => !keep.has(p));
      if (stale.length) {
        const { error } = await storage.remove(stale);
        if (!error) removed += stale.length;
      }
    }
  }
  return { removed };
}
