/**
 * Creates the first owner (or any staff member) from the command line.
 *
 *   npm run invite -- --email kennedy@example.com --name "Kennedy Kopala" --role owner
 *
 * Prints a one-time invite link to send them (they choose a password, then
 * set up two-factor sign-in). For local testing, add --password to create
 * the account directly. Needs NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "owner" },
    password: { type: "string" },
    site: { type: "string", default: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" },
  },
});

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  if (!values.email || !values.name) throw new Error('Usage: --email <email> --name "<full name>" [--role owner|staff]');
  if (values.role !== "owner" && values.role !== "staff") throw new Error("--role must be owner or staff");
  const db = createClient(url, key, { auth: { persistSession: false } });

  let userId: string;
  if (values.password) {
    const { data, error } = await db.auth.admin.createUser({ email: values.email, password: values.password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    userId = data.user.id;
    console.log(`Created ${values.email}.`);
  } else {
    const { data, error } = await db.auth.admin.generateLink({
      type: "invite",
      email: values.email,
      options: { redirectTo: `${values.site.replace(/\/$/, "")}/admin/accept` },
    });
    if (error || !data.user) throw error ?? new Error("generateLink failed");
    userId = data.user.id;
    console.log(`Invite link for ${values.email} (send it to them; it works once):\n${data.properties.action_link}`);
  }
  const { error } = await db
    .from("profiles")
    .upsert({ id: userId, full_name: values.name, email: values.email, role: values.role, active: true });
  if (error) throw error;
  console.log(`Profile saved as ${values.role}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
