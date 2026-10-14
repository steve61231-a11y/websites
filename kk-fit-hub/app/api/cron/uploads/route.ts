import { connection } from "next/server";
import { isCronRequest } from "@/lib/jobs/auth";
import { cleanUploads } from "@/lib/jobs/retention";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

/** Deletes unattached uploads older than 48 hours (PRD 8.2). */
export async function GET(request: Request) {
  await connection();
  if (!isCronRequest(request)) return new Response("Unauthorised", { status: 401 });
  if (!hasServiceRole()) return Response.json({ skipped: "no database" });
  const report = await cleanUploads(createServiceClient());
  console.log("uploads", report);
  return Response.json(report);
}
