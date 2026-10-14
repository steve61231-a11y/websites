import { expect, test } from "@playwright/test";

/** Header, mobile menu and action bar behaviour (PRD 3; Phase 0 acceptance). */

test.describe("header", () => {
  test("follows the theme of the section underneath", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header.site-header");
    await expect(header).toHaveAttribute("data-header-theme", "dark");
    const light = page.locator('#main > [data-theme="light"]').first();
    await light.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
    await page.evaluate(() => window.scrollBy(0, -1));
    await expect(header).toHaveAttribute("data-header-theme", "light");
  });

  test("hides on scroll down past 600px and returns on scroll up", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header.site-header");
    // Smooth scrolling may switch on mid-test, so keep scrolling until past 600px.
    await expect(async () => {
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(700);
      await expect(header).toHaveClass(/-translate-y-full/, { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await page.mouse.wheel(0, -200);
    await expect(header).not.toHaveClass(/-translate-y-full/);
  });

  test("has the request call to action", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator('[data-cta="nav-cta"]');
    await expect(cta).toHaveAttribute("href", "/request?source=nav");
    await expect(cta).toBeVisible();
  });
});

test.describe("navigation by width", () => {
  test("desktop shows links; smaller widths show the menu button", async ({ page }) => {
    await page.goto("/");
    const width = page.viewportSize()?.width ?? 0;
    const nav = page.getByRole("navigation", { name: "Main" });
    const menuButton = page.getByRole("button", { name: "Open menu" });
    if (width >= 1024) {
      await expect(nav).toBeVisible();
      await expect(menuButton).toBeHidden();
      expect(await page.locator('[data-cta="nav-cta"]').innerText()).toBe("Request a demonstration");
    } else {
      await expect(nav).toBeHidden();
      await expect(menuButton).toBeVisible();
      expect(await page.locator('[data-cta="nav-cta"]').innerText()).toBe("Request");
    }
  });
});

test.describe("mobile menu", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "menu is below 1024px only");

  test("opens, traps focus, locks scroll and closes on Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await expect(dialog.locator('[data-cta="menu-call"]')).toHaveAttribute("href", "tel:+254722524438");
    await expect(dialog.locator('[data-cta="menu-call"]')).toContainText("Call 0722 524 438");
    await expect(dialog.locator('[data-cta="menu-whatsapp"]')).toHaveAttribute("href", /^https:\/\/wa\.me\/254722524438\?text=/);
    await expect(dialog).toContainText("Nairobi");

    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    const insideOrToggle = await page.evaluate(() => {
      const el = document.activeElement;
      return Boolean(el?.closest("#mobile-menu") || el?.getAttribute("aria-controls") === "mobile-menu");
    });
    expect(insideOrToggle).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });

  test("closes on the X", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});

test.describe("mobile action bar", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "action bar is below 1024px only");

  test("appears once the hero scrolls out of view", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(".action-bar");
    await expect(bar).toHaveClass(/translate-y-full/);
    await expect(async () => {
      await page.mouse.wheel(0, 500);
      await expect(bar).toHaveClass(/translate-y-0/, { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect(bar.locator('[data-cta="bar-cta"]')).toHaveAttribute("href", "/request?source=bar");
  });
});
