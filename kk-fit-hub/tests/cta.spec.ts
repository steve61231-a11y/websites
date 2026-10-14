import { expect, test } from "@playwright/test";

/**
 * Every call to action in the button map (PRD 4) exists with its data-cta
 * and the correct destination. Run at desktop width so header links show.
 */
test.use({ viewport: { width: 1440, height: 900 } });

type Expectation = { cta: string; href: string | RegExp; text?: string | RegExp };

const wa = /^https:\/\/wa\.me\/254722524438\?text=/;

const pages: Record<string, Expectation[]> = {
  "/": [
    { cta: "nav-logo", href: "/" },
    { cta: "nav-cta", href: "/request?source=nav", text: "Request a demonstration" },
    { cta: "fab-whatsapp", href: wa },
    { cta: "hero-primary", href: "/request?source=hero", text: "Request a demonstration" },
    { cta: "hero-secondary", href: "/join?source=hero", text: /Coach with us/ },
    {
      cta: "flagship-primary",
      href: "/request?activity=kenpo-karate&source=flagship",
      text: "Bring Kenpo Karate to your school",
    },
    { cta: "flagship-secondary", href: "/programmes/kenpo-karate", text: /Explore the programme/ },
    { cta: "hub-card", href: /^\/programmes\/[a-z-]+$/ },
    { cta: "hub-all", href: "/programmes", text: /See all programmes/ },
    { cta: "whynow-link", href: "/schools", text: /How we work with schools/ },
    { cta: "process-cta", href: "/request?source=process", text: "Start with step one" },
    { cta: "standard-link", href: "/join?source=standard", text: /Are you a coach\? Apply to join/ },
    { cta: "founder-link", href: "/about", text: /Read Kennedy's story/ },
    { cta: "map-link", href: "/contact?source=map", text: /Outside these counties\? Talk to us/ },
    { cta: "doors-schools", href: "/request?source=doors", text: "Request a demonstration" },
    { cta: "doors-coaches", href: "/join/apply?source=doors", text: "Apply to join the team" },
    { cta: "footer-whatsapp", href: wa },
    { cta: "footer-call-1", href: "tel:+254722524438" },
    { cta: "footer-call-2", href: "tel:+254750370935" },
  ],
  "/programmes": [
    { cta: "filter-all", href: "" },
    { cta: "filter-available", href: "" },
    { cta: "filter-soon", href: "" },
    { cta: "programme-card", href: /^\/programmes\/[a-z-]+$/ },
  ],
  "/programmes/kenpo-karate": [
    { cta: "karate-primary", href: "/request?activity=kenpo-karate&source=karate", text: "Bring Kenpo Karate to your school" },
    { cta: "karate-whatsapp", href: /^https:\/\/wa\.me\/254722524438\?text=Hello%20KK%20Fit%20Hub%2C%20I'd%20like%20to%20find%20out%20about%20Kenpo%20Karate/ },
  ],
  "/programmes/chess": [
    { cta: "soon-interest", href: "/request?activity=chess&type=interest", text: "Register your school's interest" },
    { cta: "soon-coach", href: "/join/apply?activity=chess", text: /Coach Chess\? Apply to join/ },
  ],
  "/schools": [
    { cta: "schools-primary", href: "/request?source=schools", text: "Request a demonstration" },
    { cta: "schools-whatsapp", href: wa, text: /Prefer to talk\? WhatsApp us/ },
  ],
  "/join": [
    { cta: "join-primary", href: "/join/apply?source=join", text: "Apply to join the team" },
    { cta: "recruiting-chip", href: /^\/join\/apply\?activity=[a-z-]+$/ },
  ],
  "/about": [
    { cta: "about-primary", href: "/request?source=about", text: "Request a demonstration" },
    { cta: "about-coach", href: "/join", text: /Coach with us/ },
  ],
  "/contact": [
    { cta: "contact-call-1", href: "tel:+254722524438", text: "0722 524 438" },
    { cta: "contact-call-2", href: "tel:+254750370935", text: "0750 370 935" },
    { cta: "contact-whatsapp", href: wa, text: /WhatsApp us/ },
  ],
  "/this-page-does-not-exist": [
    { cta: "notfound-home", href: "/", text: "Back to home" },
    { cta: "notfound-programmes", href: "/programmes", text: /See programmes/ },
  ],
};

for (const [path, expectations] of Object.entries(pages)) {
  test(`buttons on ${path}`, async ({ page }) => {
    await page.goto(path);
    for (const e of expectations) {
      const el = page.locator(`[data-cta="${e.cta}"]`).first();
      await expect(el, e.cta).toHaveCount(1);
      if (e.href !== "") {
        const href = await el.getAttribute("href");
        if (typeof e.href === "string") expect(href, e.cta).toBe(e.href);
        else expect(href, e.cta).toMatch(e.href);
      }
      if (e.text) {
        const text = (await el.innerText()).replace(/\s+/g, " ").trim();
        if (typeof e.text === "string") expect(text, e.cta).toBe(e.text);
        else expect(text, e.cta).toMatch(e.text);
      }
    }
  });
}

test("every page has one H1 and a skip link", async ({ page }) => {
  for (const path of Object.keys(pages)) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  }
});

test("unknown routes return 404", async ({ request }) => {
  const res = await request.get("/this-page-does-not-exist");
  expect(res.status()).toBe(404);
});

test("programme filter updates ?status=", async ({ page }) => {
  await page.goto("/programmes");
  await page.getByLabel("Launching soon").click({ force: true });
  await expect(page).toHaveURL(/status=soon/);
  await expect(page.locator('[data-cta="programme-card"]')).toHaveCount(6);
  await page.goto("/programmes?status=available");
  await expect(page.locator('[data-cta="programme-card"]')).toHaveCount(1);
});
