import { createHmac, randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

/**
 * Admin end to end (PRD 17, phase 3 acceptance). Needs the database and two
 * accounts: owner@kk.test and staff@kk.test (scripts/invite.ts --password).
 */
const dbUrl = process.env.DATABASE_URL;
test.skip(!dbUrl, "DATABASE_URL is required for admin tests");
test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

const OWNER = { email: "owner@kk.test", password: "owner-password-123" };
const STAFF = { email: "staff@kk.test", password: "staff-password-123" };

let db: Client;
let inquiryId: string;
let applicationId: string;

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s). */
function totp(secret: string, at = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000)).padStart(6, "0");
}

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function ownerSecret(): Promise<string | null> {
  const { rows } = await db.query(
    "select f.secret from auth.mfa_factors f join auth.users u on u.id = f.user_id where u.email = $1 and f.status = 'verified' limit 1",
    [OWNER.email],
  );
  return rows[0]?.secret ?? null;
}

async function signInOwner(page: Page) {
  await signIn(page, OWNER);
  await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
  await page.getByLabel("6-digit code").fill(totp((await ownerSecret())!));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Hello, Kennedy/ })).toBeVisible();
}

test.beforeAll(async () => {
  db = new Client({ connectionString: dbUrl });
  await db.connect();
  await db.query(
    "delete from auth.mfa_factors where user_id = (select id from auth.users where email = $1)",
    [OWNER.email],
  );
  const inq = await db.query("select public.submit_inquiry($1::jsonb) as r", [
    JSON.stringify({
      type: "demo",
      contact_name: "Admin Test Director",
      school_name: `Admin Test School ${Date.now()}`,
      county: "Nairobi",
      phone_e164: "+254722000111",
      consent_version: "test",
      idempotency_key: randomUUID(),
      activities: ["kenpo-karate"],
    }),
  ]);
  inquiryId = inq.rows[0].r.id;
  applicationId = randomUUID();
  await db.query("select public.submit_application($1::jsonb)", [
    JSON.stringify({
      id: applicationId,
      idempotency_key: randomUUID(),
      full_name: "Admin Test Coach",
      phone_e164: "+254711000222",
      email: "coach@example.com",
      county: "Kiambu",
      is_adult: true,
      main_activity: "kenpo-karate",
      years_practising: 9,
      years_coaching: 4,
      highest_rank: "1st-degree black belt",
      experience: "Coached primary school learners at weekend clubs for four years in Kiambu.",
      first_aid: "current",
      good_conduct: "can_get",
      availability: ["Saturdays"],
      work_preference: "Part-time",
      counties: ["Kiambu"],
      consent_version: "test",
    }),
  ]);
});

test.afterAll(async () => {
  await db.query("update activities set status = 'soon' where slug = 'chess'");
  await db.end();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/admin/inquiries");
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await page.request.get("/admin/inquiries/export");
  expect(res.url()).toContain("/admin/login");
});

test("wrong password is refused", async ({ page }) => {
  await signIn(page, { email: OWNER.email, password: "nope-nope-nope" });
  await expect(page.getByRole("alert").filter({ hasText: "didn't match" })).toBeVisible();
});

test("the owner must set up two-factor sign-in", async ({ page }) => {
  await signIn(page, OWNER);
  await expect(page.getByRole("heading", { name: "Set up two-factor sign-in" })).toBeVisible();
  // The admin is unreachable until two-factor is done.
  await page.goto("/admin");
  await expect(page).toHaveURL(/step=enrol/);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const secret = (await page.locator("[data-totp-secret]").innerText()).trim();
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "didn't work" })).toBeVisible();
  await page.getByLabel("6-digit code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Hello, Kennedy/ })).toBeVisible();
  await expect(page.getByText("New requests")).toBeVisible();
});

test("staff: pipeline, notes, undo, and no approving", async ({ page }) => {
  await signIn(page, STAFF);
  await expect(page.getByRole("heading", { level: 1, name: /Hello, Amina/ })).toBeVisible();
  // Owner-only screens are not offered, and are refused.
  await page.goto("/admin/more");
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/error=owner-only/);

  await page.goto(`/admin/inquiries/${inquiryId}`);
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/254722000111\?text=Hello%20Admin%2C%20this%20is%20Amina/);
  await page.getByLabel("Status").selectOption("contacted");
  await expect(page.getByRole("status").filter({ hasText: "Status: Contacted" })).toBeVisible();
  await expect.poll(async () => (await db.query("select status from inquiries where id = $1", [inquiryId])).rows[0].status).toBe("contacted");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(async () => (await db.query("select status from inquiries where id = $1", [inquiryId])).rows[0].status).toBe("new");

  // Marking lost requires a reason.
  await page.getByLabel("Status").selectOption("lost");
  await page.getByLabel("Why was it lost?").fill("Budget not approved");
  await page.getByRole("button", { name: "Mark lost" }).click();
  await expect.poll(async () => (await db.query("select status, lost_reason from inquiries where id = $1", [inquiryId])).rows[0]).toEqual({
    status: "lost",
    lost_reason: "Budget not approved",
  });

  await page.getByLabel("Next action").fill("Call back next term");
  await page.getByLabel("Due").fill("2020-01-01");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Next action saved" })).toBeVisible();

  await page.getByLabel("Add a note").fill("Spoke to the bursar.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Spoke to the bursar.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Spoke to the bursar.")).toBeVisible();
  await expect(page.getByText(/Status: New → Lost/)).toBeVisible();

  // Applications: staff record checks but cannot approve.
  await page.goto(`/admin/applications/${applicationId}`);
  await expect(page.getByRole("button", { name: "Approve" })).toBeDisabled();
  await expect(page.getByText("Only the owner can approve.")).toBeVisible();
  await page.getByLabel("Result for Interview").selectOption("passed");
  await expect.poll(async () =>
    (await db.query("select result from vetting_checks where application_id = $1 and check_type = 'interview'", [applicationId])).rows[0].result,
  ).toBe("passed");
  await expect(page.getByRole("option", { name: "Waived" })).toHaveCount(0);
});

test("owner: approval waits for required checks, then succeeds", async ({ page }) => {
  await signInOwner(page);
  await page.goto(`/admin/applications/${applicationId}`);
  const approve = page.getByRole("button", { name: "Approve" });
  await expect(approve).toBeDisabled();
  await expect(page.getByText(/Waiting on: Live skill demonstration, Certificate of Good Conduct \(DCI\), Two references\./)).toBeVisible();
  for (const name of ["Live skill demonstration", "Certificate of Good Conduct (DCI)", "Two references"]) {
    await page.getByLabel(`Result for ${name}`).selectOption("passed");
    await expect(page.getByRole("status").filter({ hasText: `${name}: Passed` })).toBeVisible();
  }
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect.poll(async () => (await db.query("select status, decided_at from applications where id = $1", [applicationId])).rows[0].status).toBe("approved");
});

test("owner: changing an activity's status updates the public site", async ({ page, browser }) => {
  await signInOwner(page);
  await page.goto("/admin/activities");
  await page.getByText("Chess", { exact: true }).click();
  await page.getByRole("combobox", { name: "Status" }).first().selectOption("hidden");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Chess saved" })).toBeVisible();

  const visitor = await browser.newPage();
  await visitor.goto("/programmes");
  await expect(visitor.locator('[data-cta="programme-card"]')).toHaveCount(6);
  await expect(visitor.getByText("Chess", { exact: true })).toHaveCount(0);

  // Put it back the same way, which refreshes the public pages again.
  await page.reload();
  await page.getByText("Chess", { exact: true }).click();
  await page.getByRole("combobox", { name: "Status" }).first().selectOption("soon");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Chess saved" })).toBeVisible();
  await visitor.goto("/programmes");
  await expect(visitor.locator('[data-cta="programme-card"]')).toHaveCount(7);
  await visitor.close();
});

test("owner: CSV export of the current filter", async ({ page }) => {
  await signInOwner(page);
  const res = await page.request.get("/admin/inquiries/export?status=lost");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const csv = await res.text();
  expect(csv.split("\r\n")[0]).toContain('"ref","created","type","status"');
  expect(csv).toContain("Budget not approved");
  expect(csv).not.toContain('"new"');
});

test("owner: every admin screen is usable at 375px", async ({ page }) => {
  test.setTimeout(120_000);
  await signInOwner(page);
  const screens = [
    "/admin",
    "/admin/inquiries",
    "/admin/inquiries?view=board",
    `/admin/inquiries/${inquiryId}`,
    "/admin/applications",
    `/admin/applications/${applicationId}`,
    "/admin/roles",
    "/admin/activities",
    "/admin/content",
    "/admin/settings",
    "/admin/team",
    "/admin/log",
    "/admin/more",
    "/admin/account",
  ];
  for (const path of screens) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 2).join(", ")}`),
      path,
    ).toEqual([]);
  }
  // Admin pages are never indexed.
  const res = await page.request.get("/admin");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});
