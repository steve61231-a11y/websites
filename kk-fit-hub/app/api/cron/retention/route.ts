import { connection } from "next/server";
import { isCronRequest } from "@/lib/jobs/auth";
import { runRetention } from "@/lib/jobs/retention";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

/** Nightly retention job (PRD 14.5). */
export async function GET(request: Request) {
  await connection();
  if (!isCronRequest(request)) return new Response("Unauthorised", { status: 401 });
  if (!hasServiceRole()) return Response.json({ skipped: "no database" });
  const report = await runRetention(createServiceClient());
  console.log("retention", report);
  return Response.json(report);
}
