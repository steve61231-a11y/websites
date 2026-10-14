import { expect, test, type Page } from "@playwright/test";

/** Motion acceptance (PRD 17, phase 4). Runs once, in the desktop project. */
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, "runs at desktop width");

const heavy = /three|fiber|drei|lenis|gsap|ScrollTrigger|SplitText/i;

async function scriptsLoaded(page: Page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => (e as PerformanceResourceTiming).initiatorType === "script" || e.name.endsWith(".js"))
      .map((e) => ({ name: e.name, size: (e as PerformanceResourceTiming).encodedBodySize })),
  );
}

/** Reads the module source of every loaded chunk and reports which heavy libraries are present. */
async function heavyChunks(page: Page): Promise<string[]> {
  const scripts = await scriptsLoaded(page);
  const found: string[] = [];
  for (const s of scripts) {
    if (!s.name.includes("/_next/static/")) continue;
    const body = await (await page.request.get(s.name)).text();
    if (/WebGLRenderer|BufferGeometry/.test(body)) found.push(`three:${s.name}`);
    if (/lenis/i.test(body) && /smoothWheel|wheelMultiplier/.test(body)) found.push(`lenis:${s.name}`);
    if (/ScrollTrigger/.test(body) && /scrollerProxy|pinSpacing/.test(body)) found.push(`gsap:${s.name}`);
  }
  return found;
}

async function scrollThrough(page: Page) {
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(800);
}

test("reduced motion: defaults only, no smooth scroll, no heavy code", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-tier", "C");
  await scrollThrough(page);
  expect(await page.evaluate(() => "lenis" in document.documentElement.dataset)).toBe(false);
  expect(await page.locator("canvas").count()).toBe(0);
  expect(await heavyChunks(page)).toEqual([]);
  // The page is complete: every section's text is present and visible.
  await expect(page.getByRole("heading", { name: "Every coach earns their place." })).toBeVisible();
});

test("tier C (Data Saver): no three.js, Lenis or GSAP downloaded", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true, effectiveType: "4g" }, configurable: true });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-tier", "C");
  await scrollThrough(page);
  expect(await heavyChunks(page)).toEqual([]);
  const names = (await scriptsLoaded(page)).map((s) => s.name);
  expect(names.filter((n) => heavy.test(n))).toEqual([]);
});

test("home JavaScript before interaction is within budget (170 KB gzipped)", async ({ request }) => {
  // The scripts the home page's HTML loads up front (route prefetches come
  // later, at low priority). Legacy nomodule polyfills are never fetched by
  // modern browsers, so they are excluded.
  const html = await (await request.get("/")).text();
  const srcs = [...html.matchAll(/<script(?![^>]*noModule)[^>]*src="([^"]+\.js)"/gi)].map((m) => m[1]);
  let total = 0;
  for (const src of new Set(srcs)) {
    const res = await request.get(src);
    // Playwright decompresses responses; measure the gzipped size ourselves.
    const { gzipSync } = await import("node:zlib");
    total += gzipSync(await res.body(), { level: 6 }).length;
  }
  test.info().annotations.push({ type: "home-js-gzip", description: `${(total / 1024).toFixed(1)} KB in ${srcs.length} files` });
  console.log(`home initial JS: ${(total / 1024).toFixed(1)} KB gzipped in ${srcs.length} files`);
  expect(total).toBeLessThanOrEqual(170 * 1024);
});

test("tier A: enhanced slots load without layout shift, WebGL within budget", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number; __shiftLog: string[] };
    w.__cls = 0;
    w.__shiftLog = [];
    type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Shift[]) {
        if (e.hadRecentInput) continue;
        w.__cls += e.value;
        w.__shiftLog.push(`${e.value.toFixed(3)} ${(e.sources ?? []).map((s) => (s.node as Element | undefined)?.className?.toString().slice(0, 40)).join(" | ")}`);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/?tier=A");
  await expect(page.locator("html")).toHaveAttribute("data-tier", "A");
  await expect.poll(() => page.evaluate(() => "lenis" in document.documentElement.dataset)).toBe(true);
  await scrollThrough(page);
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  test.info().annotations.push({ type: "cls", description: cls.toFixed(4) });
  if (cls > 0.05) console.log(await page.evaluate(() => (window as unknown as { __shiftLog: string[] }).__shiftLog.join("\n")));
  expect(cls).toBeLessThanOrEqual(0.05);

  await expect(page.locator("canvas")).toHaveCount(1);
  const before = await page.evaluate(() => performance.getEntriesByType("resource").length);
  expect(before).toBeGreaterThan(0);
  const webgl = (await scriptsLoaded(page)).filter((s) => s.name.includes("/_next/static/"));
  const heavyFiles: { name: string; size: number }[] = [];
  for (const s of webgl) {
    const body = await (await page.request.get(s.name)).text();
    if (/WebGLRenderer|BufferGeometry|useFrame|tunnel/.test(body)) heavyFiles.push(s);
  }
  const webglTotal = heavyFiles.reduce((sum, s) => sum + s.size, 0);
  test.info().annotations.push({ type: "webgl-gzip", description: `${(webglTotal / 1024).toFixed(1)} KB` });
  expect(webglTotal).toBeLessThanOrEqual(250 * 1024);
});

test("tier A: the hub particles follow the active card", async ({ page }) => {
  await page.goto("/?tier=A");
  for (let i = 0; i < 40; i++) {
    const top = await page.evaluate(() => document.querySelector("[data-hub-stage]")!.getBoundingClientRect().top);
    if (top < 200) break;
    await page.mouse.wheel(0, Math.min(600, top - 120));
    await page.waitForTimeout(250);
  }
  await expect(page.locator("[data-hub-view]")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector("[data-hub-default]")!).opacity)).toBe("0");
  await page.locator("[data-hub-card] a").nth(2).hover();
  await expect(page.locator("[data-hub-stage]")).toHaveAttribute("data-active-glyph", "skating");
});
