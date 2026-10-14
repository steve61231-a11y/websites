/**
 * Cookieless analytics events (PRD 16.3). Events never carry names, phone
 * numbers or emails. Works with Plausible's `plausible()` or Umami's
 * `umami.track()`; a no-op until a script is configured.
 */
type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    umami?: { track: (event: string, props?: Props) => void };
  }
}

export type AnalyticsEvent =
  | "cta_click"
  | "form_start"
  | "form_step"
  | "form_error"
  | "form_submit"
  | "request_details_added"
  | "whatsapp_click"
  | "call_click"
  | "motion_tier";

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  const clean = props ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) : undefined;
  try {
    if (window.plausible) window.plausible(event, clean ? { props: clean } : undefined);
    else if (window.umami) window.umami.track(event, clean);
  } catch {
    // Analytics must never break the page.
  }
}
