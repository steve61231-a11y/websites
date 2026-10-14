import { resolveStaff } from "@/lib/admin/dal";
import { createServiceClient } from "@/lib/supabase/admin";

/** Staff view applicant documents through signed URLs valid for 60 seconds (PRD 14.3). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await resolveStaff();
  if (!r.ok) return new Response("Not signed in", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  // Read through the staff session (RLS), then sign with the service role.
  const { data: file } = await r.staff.db.from("application_files").select("storage_path").eq("id", id).maybeSingle();
  if (!file) return new Response("Not found", { status: 404 });
  const { data, error } = await createServiceClient().storage.from("applicant-files").createSignedUrl(file.storage_path, 60);
  if (error || !data) return new Response("Couldn't open the file", { status: 502 });
  return Response.redirect(data.signedUrl, 303);
}
