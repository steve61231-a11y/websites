import { expect, test } from "@playwright/test";
import { Client } from "pg";

/** SEO, headers and scheduled jobs (PRD 16, 14.6; phase 5). Runs once, at desktop width. */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, "runs once");

const titles: Record<string, string> = {
  "/": "KK Fit Hub · Co-curricular programmes for Kenyan schools",
  "/programmes": "Programmes · KK Fit Hub",
  "/programmes/kenpo-karate": "Kenpo Karate for schools · KK Fit Hub",
  "/schools": "For schools · KK Fit Hub",
  "/join": "Coach with us · KK Fit Hub",
  "/about": "About Kennedy Kopala and KK Fit Hub · KK Fit Hub",
  "/contact": "Contact · KK Fit Hub",
};

test("titles, descriptions, canonical URLs and language", async ({ page }) => {
  for (const [path, title] of Object.entries(titles)) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]'), path).toHaveAttribute("content", /.{40,}/);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute("href", /\/|https?:/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-KE");
    await expect(page.locator('meta[property="og:image"]').first(), path).toHaveAttribute("content", /opengraph-image/);
  }
});

async function jsonLd(page: import("@playwright/test").Page) {
  return page.$$eval('script[type="application/ld+json"]', (els) =>
    els.flatMap((e) => {
      const d = JSON.parse(e.textContent ?? "null");
      return Array.isArray(d) ? d : [d];
    }),
  );
}

test("structured data", async ({ page }) => {
  await page.goto("/");
  let data = await jsonLd(page);
  const org = data.find((d) => d["@type"] === "Organization");
  expect(org.name).toBe("KK Fit Hub");
  expect(org.founder.name).toBe("Kennedy Kopala");
  expect(org.areaServed.length).toBeGreaterThan(0);
  expect(data.some((d) => d["@type"] === "Service")).toBe(true);
  for (const [path, type] of [["/about", "Person"], ["/schools", "FAQPage"], ["/programmes/kenpo-karate", "FAQPage"], ["/join", "FAQPage"]]) {
    await page.goto(path);
    data = await jsonLd(page);
    expect(data.map((d) => d["@type"]), path).toContain(type);
    expect(data.map((d) => d["@type"]), path).toContain("Organization");
  }
});

test("sitemap, robots and Open Graph image", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const p of ["/programmes/kenpo-karate", "/programmes/chess", "/schools", "/join/apply", "/privacy"]) expect(sitemap).toContain(p);
  expect(sitemap).not.toContain("/admin");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/admin/);
  expect(robots).toMatch(/Sitemap: .*sitemap\.xml/);
  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("security headers", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("https://challenges.cloudflare.com");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("accelerometer=(self)");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("no console errors on public pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of ["/", "/programmes", "/programmes/kenpo-karate", "/programmes/chess", "/schools", "/join", "/about", "/contact", "/privacy", "/request", "/join/apply"]) {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});

test("scheduled jobs refuse requests without the secret", async ({ request }) => {
  for (const job of ["retention", "uploads", "digest"]) {
    expect((await request.get(`/api/cron/${job}`)).status(), job).toBe(401);
    expect((await request.get(`/api/cron/${job}`, { headers: { authorization: "Bearer wrong" } })).status(), job).toBe(401);
  }
});

test("retention job anonymises old lost requests", async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  test.skip(!secret || !dbUrl, "needs CRON_SECRET and DATABASE_URL");
  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  try {
    const { rows } = await db.query(
      `insert into inquiries (type, status, lost_reason, contact_name, school_name, phone_e164, email, message, consent_at, consent_version)
       values ('demo', 'lost', 'test', 'Old Contact', 'Old School', '+254700999888', 'old@example.com', 'hello', now(), 'test') returning id`,
    );
    const id = rows[0].id;
    await db.query("alter table inquiries disable trigger inquiries_updated_at");
    await db.query("update inquiries set updated_at = now() - interval '25 months' where id = $1", [id]);
    await db.query("alter table inquiries enable trigger inquiries_updated_at");
    const res = await request.get("/api/cron/retention", { headers: { authorization: `Bearer ${secret}` } });
    expect(res.status()).toBe(200);
    expect((await res.json()).inquiriesAnonymised).toBeGreaterThanOrEqual(1);
    const after = await db.query("select contact_name, phone_e164, email, message, anonymised_at, school_name from inquiries where id = $1", [id]);
    expect(after.rows[0]).toMatchObject({ contact_name: "Anonymised", phone_e164: null, email: null, message: null, school_name: "Old School" });
    expect(after.rows[0].anonymised_at).not.toBeNull();
    await db.query("delete from inquiries where id = $1", [id]);
  } finally {
    await db.end();
  }
});

test("upload clean-up removes old unattached files only", async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  test.skip(!secret, "needs CRON_SECRET");
  const res = await request.get("/api/cron/uploads", { headers: { authorization: `Bearer ${secret}` } });
  expect(res.status()).toBe(200);
  expect(typeof (await res.json()).removed).toBe("number");
});
