/** Site-wide constants and the public settings fallback (PRD 3, 8.6, 14.1). */

export const brand = {
  name: "KK Fit Hub",
  line: "Transforming academic learning through extra-curricular activities.",
  founder: "Kennedy Kopala",
} as const;

export type PublicSettings = {
  /** E.164 numbers, display order. */
  phones: string[];
  whatsappE164: string;
  email: string | null;
  socials: Record<string, string>;
  counties: string[];
  /** e.g. "2 working days" */
  responseTimeText: string;
  startTermOptions: string[];
};

/**
 * Used until the database is connected, and as the seed for site_settings.
 * Keep in step with supabase/seed.sql.
 */
export const defaultSettings: PublicSettings = {
  phones: ["+254722524438", "+254750370935"],
  // CONFIRM: which of the two numbers is on WhatsApp (open item 5).
  whatsappE164: "+254722524438",
  // CONFIRM: organisation email; hidden until set (open item 12).
  email: null,
  // CONFIRM: social media accounts; hidden until set (open item 15).
  socials: {},
  // CONFIRM: Homa Bay in the launch counties (open item 3).
  counties: ["Nairobi", "Kiambu", "Kajiado", "Machakos", "Nakuru", "Homa Bay"],
  // CONFIRM: response time (open item 5).
  responseTimeText: "2 working days",
  startTermOptions: [
    "Term 1 2027",
    "Term 2 2027",
    "Term 3 2027",
    "As soon as possible",
    "Not sure",
  ],
};

/** "Nairobi, Kiambu, Kajiado, Machakos, Nakuru and Homa Bay" */
export function joinList(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

export const navLinks = [
  { href: "/programmes", label: "Programmes" },
  { href: "/schools", label: "For Schools" },
  { href: "/join", label: "Join the Team" },
  { href: "/about", label: "About" },
] as const;
