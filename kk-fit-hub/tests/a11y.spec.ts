import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Zero axe violations on every public page (PRD 16.4). */
const routes = [
  "/",
  "/programmes",
  "/programmes/kenpo-karate",
  "/programmes/chess",
  "/schools",
  "/join",
  "/about",
  "/contact",
  "/privacy",
  "/request",
  "/request?activity=chess&type=interest",
  "/join/apply",
  "/this-page-does-not-exist",
];

for (const route of routes) {
  test(`no axe violations on ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    }));
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
  });
}

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const route of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});
