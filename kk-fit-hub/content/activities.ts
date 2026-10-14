/**
 * The seven activities (PRD 6.4). This is the fallback used until the
 * database is connected and the source for supabase/seed.sql.
 */

export type ActivityStatus = "available" | "soon" | "hidden";

export type GlyphId =
  | "karate"
  | "chess"
  | "skating"
  | "ballet"
  | "dance"
  | "music"
  | "coding";

export type Activity = {
  id: string;
  slug: string;
  name: string;
  oneLiner: string;
  description: string | null;
  outcomes: string[];
  ageRange: string | null;
  status: ActivityStatus;
  recruiting: boolean;
  glyph: GlyphId;
  sortOrder: number;
};

export const seedActivities: Activity[] = [
  {
    id: "seed-kenpo-karate",
    slug: "kenpo-karate",
    name: "Kenpo Karate",
    oneLiner: "Discipline, focus and fitness through martial arts.",
    description: null,
    outcomes: ["Discipline", "Focus", "Fitness", "Confidence", "Safety"],
    // CONFIRM: ages and group sizes for karate (open item 6).
    ageRange: "Primary to university",
    status: "available",
    // CONFIRM: which disciplines are recruiting.
    recruiting: true,
    glyph: "karate",
    sortOrder: 1,
  },
  {
    id: "seed-chess",
    slug: "chess",
    name: "Chess",
    oneLiner: "Strategy, patience and sharper thinking.",
    description: null,
    // CONFIRM: outcomes drawn from the one-liner.
    outcomes: ["Strategy", "Patience", "Sharper thinking"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "chess",
    sortOrder: 2,
  },
  {
    id: "seed-skating",
    slug: "skating",
    name: "Skating",
    oneLiner: "Balance, coordination and courage.",
    description: null,
    // CONFIRM: outcomes drawn from the one-liner.
    outcomes: ["Balance", "Coordination", "Courage"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "skating",
    sortOrder: 3,
  },
  {
    id: "seed-ballet",
    slug: "ballet",
    name: "Ballet",
    oneLiner: "Poise, strength and artistry.",
    description: null,
    // CONFIRM: outcomes drawn from the one-liner.
    outcomes: ["Poise", "Strength", "Artistry"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "ballet",
    sortOrder: 4,
  },
  {
    id: "seed-modern-dance",
    slug: "modern-dance",
    name: "Modern Dance",
    oneLiner: "Expression, rhythm and teamwork.",
    description: null,
    // CONFIRM: outcomes drawn from the one-liner.
    outcomes: ["Expression", "Rhythm", "Teamwork"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "dance",
    sortOrder: 5,
  },
  {
    id: "seed-music",
    slug: "music",
    name: "Music",
    oneLiner: "Creativity, practice and performance.",
    description: null,
    // CONFIRM: outcomes drawn from the one-liner.
    outcomes: ["Creativity", "Practice", "Performance"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "music",
    sortOrder: 6,
  },
  {
    id: "seed-coding-robotics",
    slug: "coding-robotics",
    name: "Coding & Robotics",
    oneLiner: "Problem-solving for a digital future.",
    description: null,
    // CONFIRM: the PRD gives one outcome; the other two are draft.
    outcomes: ["Problem-solving", "Building and testing ideas", "Skills for a digital future"],
    ageRange: null,
    status: "soon",
    recruiting: true,
    glyph: "coding",
    sortOrder: 7,
  },
];

export const statusLabel: Record<Exclude<ActivityStatus, "hidden">, string> = {
  available: "Available now",
  soon: "Launching soon",
};
