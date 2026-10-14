import { resolveStaff } from "@/lib/admin/dal";

/** Owner-only "Export this person's data" as JSON (PRD 14.5). The export is logged. */
export async function GET(request: Request) {
  const r = await resolveStaff();
  if (!r.ok) return new Response("Not signed in", { status: 401 });
  if (!r.staff.isOwner) return new Response("Owner only", { status: 403 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id) || (kind !== "inquiry" && kind !== "application")) {
    return new Response("Bad request", { status: 400 });
  }
  const db = r.staff.db;
  const record =
    kind === "inquiry"
      ? await db.from("inquiries").select("*, inquiry_activities(activities(name))").eq("id", id).maybeSingle()
      : await db
          .from("applications")
          .select("*, application_activities(activities(name)), application_referees(*), application_files(kind, original_name, mime, size_bytes, created_at), vetting_checks(check_type, result, recorded_at, note)")
          .eq("id", id)
          .maybeSingle();
  if (!record.data) return new Response("Not found", { status: 404 });
  const notes = await db.from("notes").select("body, created_at").eq("entity_type", kind).eq("entity_id", id);
  // Record the export in the audit log (through a note-free event).
  await db.from("notes").insert({ entity_type: kind, entity_id: id, body: "Personal data exported by the owner.", author_id: r.staff.id });
  const body = JSON.stringify({ exported_at: new Date().toISOString(), kind, record: record.data, notes: notes.data ?? [] }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="kk-${kind}-${id}.json"`,
      "cache-control": "no-store",
    },
  });
}
