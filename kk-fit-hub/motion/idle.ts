/**
 * Resolves once the page has loaded and the main thread is idle, so enhanced
 * code never competes with first paint or the first interaction (PRD 12).
 */
let ready: Promise<void> | null = null;
export function afterLoadIdle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ready ??= new Promise<void>((resolve) => {
    const idle = () =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => resolve(), { timeout: 4000 })
        : setTimeout(resolve, 1200);
    if (document.readyState === "complete") setTimeout(idle, 600);
    else window.addEventListener("load", () => setTimeout(idle, 600), { once: true });
  });
  return ready;
}

/** Hands out idle periods one at a time, so enhanced slots start in separate
 * idle callbacks instead of one long task. */
let queue: Promise<void> = Promise.resolve();
export function nextIdleTurn(): Promise<void> {
  const turn = queue.then(async () => {
    await afterLoadIdle();
    await new Promise<void>((resolve) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(() => resolve(), { timeout: 2000 }) : setTimeout(resolve, 50),
    );
  });
  queue = turn;
  return turn;
}
