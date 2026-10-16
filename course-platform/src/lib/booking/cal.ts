// The Cal.com booking page, ready to show inside our own page.
// Pure: builds the address only. Name and email are filled in so the student
// doesn't type them twice; the topic and their notes go into Cal.com's
// standard "notes" box, which every event has.

/** The plain booking link (no embed settings), for emails. Empty when no link is set yet. */
export function calBookingUrl(p: { url: string; name: string; email: string; topic: string; notes: string }): string {
  const u = calEmbedUrl({ ...p, theme: "light" });
  if (!u) return "";
  const url = new URL(u);
  for (const k of ["embed", "embedType", "layout", "theme"]) url.searchParams.delete(k);
  return url.toString();
}

export function calEmbedUrl(p: { url: string; name: string; email: string; topic: string; notes: string; theme: "light" | "dark" }): string | null {
  let u: URL;
  try {
    u = new URL(p.url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  u.searchParams.set("embed", "true");
  u.searchParams.set("embedType", "inline");
  u.searchParams.set("layout", "month_view");
  u.searchParams.set("theme", p.theme);
  u.searchParams.set("name", p.name);
  u.searchParams.set("email", p.email);
  u.searchParams.set("notes", [`Topic: ${p.topic}`, p.notes.trim()].filter(Boolean).join("\n"));
  return u.toString();
}
