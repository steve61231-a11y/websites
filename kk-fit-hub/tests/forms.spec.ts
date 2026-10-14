import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

/**
 * Forms end to end (PRD 17, phase 2 acceptance). Needs the database:
 * run with the local stack (npm run stack:start) or a Supabase project, and
 * DATABASE_URL pointing at it.
 */
const dbUrl = process.env.DATABASE_URL;
test.skip(!dbUrl, "DATABASE_URL is required for form tests");
test.describe.configure({ mode: "serial" });

let db: Client;
test.beforeAll(async () => {
  db = new Client({ connectionString: dbUrl });
  await db.connect();
});
test.afterAll(async () => {
  await db?.end();
});
test.beforeEach(async () => {
  // Tests share one IP; start each with a clean rate-limit window.
  await db.query("delete from public.rate_limits");
});

/** A unique Kenyan mobile number per test run. */
function testPhone(): string {
  return `07${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
}
const e164 = (local: string) => `+254${local.slice(1)}`;

async function fillRequest(page: Page, phone: string, opts: { school?: string } = {}) {
  await page.getByLabel("Your name").fill("Jane Wanjiru");
  await page.getByLabel("Your role", { exact: true }).selectOption("Principal / head teacher");
  await page.getByLabel("School or institution").fill(opts.school ?? "Playwright Academy");
  await page.getByLabel("County", { exact: true }).selectOption("Kiambu");
  await page.getByLabel("Phone").fill(phone);
}

test("demonstration request: validation, both steps and WhatsApp reference", async ({ page }) => {
  await page.goto("/request?activity=kenpo-karate&source=hero&utm_source=whatsapp");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Request a demonstration");

  // Submitting empty shows the summary and focuses the first error.
  await page.getByRole("checkbox", { name: /Kenpo Karate/ }).uncheck();
  await page.getByRole("button", { name: "Send request" }).click();
  const summary = page.locator("[data-error-summary]");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("Please enter your name");
  await expect(summary).toContainText("Choose at least one activity.");
  await expect(page.getByLabel("Your name")).toBeFocused();

  const phone = testPhone();
  await fillRequest(page, "0722");
  await page.getByLabel("School or institution").focus();
  await page.getByLabel("Phone").blur();
  await expect(page.getByText("Enter a Kenyan phone number, for example 0722 524 438.").first()).toBeVisible();
  await page.getByLabel("Phone").fill(phone);
  await page.getByRole("checkbox", { name: /Kenpo Karate/ }).check();
  await page.getByRole("checkbox", { name: /I agree that KK Fit Hub may contact me/ }).check();
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(page.getByRole("heading", { name: "Request received." })).toBeVisible();
  const text = await page.locator("[data-success]").innerText();
  const ref = text.match(/KK-\d{4,}/)?.[0];
  expect(ref).toBeTruthy();
  await expect(page.locator("[data-success]")).toContainText("Thank you, Jane.");

  const { rows } = await db.query(
    "select i.*, array(select a.slug from inquiry_activities ia join activities a on a.id = ia.activity_id where ia.inquiry_id = i.id) as slugs from inquiries i where ref = $1",
    [ref],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].type).toBe("demo");
  expect(rows[0].status).toBe("new");
  expect(rows[0].phone_e164).toBe(e164(phone));
  expect(rows[0].source).toBe("hero");
  expect(rows[0].utm).toEqual({ utm_source: "whatsapp" });
  expect(rows[0].slugs).toEqual(["kenpo-karate"]);
  expect(rows[0].consent_version).toBeTruthy();

  const wa = page.locator('[data-cta="success-whatsapp"]');
  expect(decodeURIComponent((await wa.getAttribute("href")) ?? "")).toContain(
    `I've just sent a request for Playwright Academy. My reference is ${ref}.`,
  );

  // Step 2.
  await page.getByRole("button", { name: "Add details (1 minute)" }).click();
  await page.getByRole("radio", { name: "Private" }).check();
  await page.getByRole("radio", { name: "100–300" }).check();
  await page.getByRole("checkbox", { name: "Grades 4–6" }).check();
  await page.getByRole("checkbox", { name: "Sat" }).check();
  await page.getByLabel("Anything else").fill("We have a hall we can use.");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("heading", { name: "Details saved." })).toBeVisible();

  const after = await db.query("select sector, learners_band, grades, preferred_days, message, details_added_at from inquiries where ref = $1", [ref]);
  expect(after.rows[0]).toMatchObject({
    sector: "Private",
    learners_band: "100–300",
    grades: ["Grades 4–6"],
    preferred_days: ["Sat"],
    message: "We have a hall we can use.",
  });
  expect(after.rows[0].details_added_at).not.toBeNull();
});

test("register interest mode", async ({ page }) => {
  await page.goto("/request?activity=chess&type=interest");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Register your school's interest");
  await expect(page.getByRole("checkbox", { name: /^Chess/ })).toBeChecked();
  const phone = testPhone();
  await fillRequest(page, phone, { school: "Interest School" });
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: "Register interest" }).click();
  await expect(page.getByRole("heading", { name: "Interest registered." })).toBeVisible();
  await expect(page.locator("[data-success]")).toContainText("We'll contact Interest School first when Chess launches.");
  const { rows } = await db.query("select type from inquiries where phone_e164 = $1", [e164(phone)]);
  expect(rows.map((r) => r.type)).toEqual(["interest"]);
});

test("a double submit creates one record", async ({ page }) => {
  await page.goto("/request");
  const phone = testPhone();
  await fillRequest(page, phone);
  await page.getByRole("checkbox", { name: /Kenpo Karate/ }).check();
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  const button = page.getByRole("button", { name: "Send request" });
  await button.dblclick();
  await expect(page.getByRole("heading", { name: "Request received." })).toBeVisible();
  const { rows } = await db.query("select count(*)::int as n from inquiries where phone_e164 = $1", [e164(phone)]);
  expect(rows[0].n).toBe(1);
});

test("rate limit triggers on the sixth request in an hour", async ({ page }) => {
  test.setTimeout(120_000);
  const phone = testPhone();
  for (let i = 1; i <= 6; i++) {
    await page.goto("/request");
    await fillRequest(page, phone, { school: `Rate School ${i}` });
    await page.getByRole("checkbox", { name: /Kenpo Karate/ }).check();
    await page.getByRole("checkbox", { name: /I agree/ }).check();
    await page.getByRole("button", { name: "Send request" }).click();
    if (i < 6) {
      await expect(page.getByRole("heading", { name: "Request received." })).toBeVisible();
    } else {
      await expect(
        page.getByRole("alert").filter({ hasText: "You've sent a few of these already. Please wait a few minutes, or WhatsApp us." }),
      ).toBeVisible();
    }
  }
  const { rows } = await db.query("select count(*)::int as n from inquiries where phone_e164 = $1", [e164(phone)]);
  expect(rows[0].n).toBe(5);
});

test("a filled honeypot is rejected silently", async ({ page }) => {
  await page.goto("/request");
  const phone = testPhone();
  await fillRequest(page, phone);
  await page.getByRole("checkbox", { name: /Kenpo Karate/ }).check();
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.locator("#website").evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("heading", { name: "Request received." })).toBeVisible();
  const { rows } = await db.query("select count(*)::int as n from inquiries where phone_e164 = $1", [e164(phone)]);
  expect(rows[0].n).toBe(0);
});

test("contact form", async ({ page }) => {
  await page.goto("/contact?source=map");
  const phone = testPhone();
  await page.getByLabel("Name", { exact: true }).fill("Peter Otieno");
  await page.getByLabel("Phone").fill(phone);
  await page.getByRole("radio", { name: "Parent" }).check();
  await page.getByLabel("Message", { exact: true }).fill("Do you run holiday karate camps for children?");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent." })).toBeVisible();
  await expect(page.locator("[data-success]")).toContainText("We'll get back to you within 2 working days.");
  const { rows } = await db.query("select type, contact_role, message, source from inquiries where phone_e164 = $1", [e164(phone)]);
  expect(rows).toEqual([
    { type: "general", contact_role: "Parent", message: "Do you run holiday karate camps for children?", source: "map" },
  ]);
});

test("coach application with uploads, drafts and review", async ({ page }) => {
  test.setTimeout(120_000);
  const phone = testPhone();
  await page.goto("/join/apply?activity=chess&source=doors");
  await expect(page.getByText("Step 1 of 4: About you")).toBeVisible();

  // Continue with nothing filled shows errors.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("[data-error-summary]")).toContainText("Please enter your full name");

  await page.getByLabel("Full name").fill("Grace Achieng");
  await page.getByLabel("Phone").fill(phone);
  await page.getByLabel("Email").fill("grace@example.com");
  await page.getByLabel("County where you live").selectOption("Nakuru");
  // Errors clear as fields are fixed; wait for the layout to settle before the next tap.
  await expect(page.locator("#f-step1-county-error")).toHaveCount(0);
  await page.getByLabel("I am 18 or older").check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 2 of 4: Your discipline")).toBeVisible();
  await expect(page.getByLabel("Main discipline", { exact: true })).toHaveValue("chess");

  // Drafts survive a reload on this device.
  await page.getByLabel("Highest rank, grade or qualification").fill("FIDE Candidate Master");
  await page.reload();
  await expect(page.getByText("Welcome back. We saved your answers on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Highest rank, grade or qualification")).toHaveValue("FIDE Candidate Master");

  await page.getByRole("checkbox", { name: "Kenpo Karate" }).check();
  await page.getByLabel("Years practising").fill("12");
  await page.getByLabel("Years coaching").fill("6");
  await page.getByLabel("Experience coaching young people").fill(
    "I have run school chess clubs in Nakuru for six years, coaching learners aged 8 to 17 for county tournaments.",
  );
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 3 of 4: Proof and checks")).toBeVisible();
  // Too large a file is refused before upload.
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "huge.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(11 * 1024 * 1024),
  });
  await expect(page.getByText("That file is too large or isn't a PDF or image. Try one under 10 MB.").first()).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, "fixtures", "certificate.pdf"));
  await expect(page.getByRole("button", { name: "Remove certificate.pdf" })).toBeVisible();
  await page.getByRole("radio", { name: "Current", exact: true }).check();
  await page.locator('input[type="file"]').nth(1).setInputFiles(path.join(__dirname, "fixtures", "first-aid.png"));
  await expect(page.getByRole("button", { name: "Remove first-aid.png" })).toBeVisible();
  await page.getByRole("radio", { name: "I can get one" }).check();
  await page.getByLabel("Name").first().fill("Coach Mwangi");
  await page.getByLabel("Phone").first().fill("0711 222 333");
  await page.getByLabel("Relationship").first().fill("Former club coach");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Step 4 of 4: Availability")).toBeVisible();
  await page.getByRole("checkbox", { name: "Saturdays" }).check();
  await page.getByRole("radio", { name: "Part-time" }).check();
  await page.getByRole("checkbox", { name: "Nakuru" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Review your application")).toBeVisible();
  await expect(page.getByRole("region", { name: "Proof and checks" })).toContainText("certificate.pdf");
  await page.getByRole("button", { name: "Edit Your discipline" }).click();
  await expect(page.getByText("Step 2 of 4: Your discipline")).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: /I confirm this information is true/ }).check();
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("heading", { name: "Application received." })).toBeVisible();
  const ref = (await page.locator("[data-success]").innerText()).match(/KKC-\d{4}/)?.[0];
  expect(ref).toBeTruthy();

  const { rows } = await db.query(
    `select a.*, (select slug from activities where id = a.main_activity_id) as main,
       (select count(*)::int from application_referees r where r.application_id = a.id) as referees,
       (select json_agg(json_build_object('kind', f.kind, 'path', f.storage_path, 'name', f.original_name)) from application_files f where f.application_id = a.id) as files,
       (select count(*)::int from vetting_checks c where c.application_id = a.id) as checks
     from applications a where ref = $1`,
    [ref],
  );
  expect(rows).toHaveLength(1);
  const app = rows[0];
  expect(app).toMatchObject({ status: "new", main: "chess", years_practising: 12, first_aid: "current", referees: 1, checks: 5 });
  expect(app.source).toBe("doors");
  expect(app.files).toHaveLength(2);
  for (const f of app.files) expect(f.path).toMatch(new RegExp(`^applications/${app.id}/`));

  // The draft is cleared after submitting.
  await page.goto("/join/apply");
  await expect(page.getByText("Step 1 of 4: About you")).toBeVisible();
});

test("anonymous Supabase clients cannot read inquiries, applications or files", async ({ request }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  test.skip(!url || !anon, "Supabase URL and anon key required");
  const headers = { apikey: anon!, authorization: `Bearer ${anon}` };
  for (const table of ["inquiries", "applications", "application_files", "application_referees", "notes", "activity_log"]) {
    const res = await request.get(`${url}/rest/v1/${table}?select=*`, { headers });
    const body = res.ok() ? await res.json() : [];
    expect(Array.isArray(body) ? body.length : 0, table).toBe(0);
  }
  const insert = await request.post(`${url}/rest/v1/inquiries`, {
    headers: { ...headers, "content-type": "application/json" },
    data: { type: "demo", contact_name: "x", phone_e164: "+254700000000", consent_at: new Date().toISOString(), consent_version: "x" },
  });
  expect(insert.ok()).toBe(false);
  const files = await request.post(`${url}/storage/v1/object/list/applicant-files`, {
    headers: { ...headers, "content-type": "application/json" },
    data: { prefix: "applications" },
  });
  const listed = files.ok() ? await files.json() : [];
  expect(Array.isArray(listed) ? listed.length : 0).toBe(0);
});
