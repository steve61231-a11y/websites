// Domain types. These mirror the Supabase schema in /supabase/migrations so the
// sample catalog can be swapped for real queries without touching the UI.

export type QuestionType = "multiple_choice" | "true_false" | "scenario";

export type QuizOption = {
  id: string;
  text: string;
  // In production `correct` never reaches the browser: answers are graded by a
  // server function. The demo grades locally.
  correct: boolean;
};

export type QuizQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  scenario?: string;
  options: QuizOption[];
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  passingScore: number; // 0–1
  questions: QuizQuestion[];
};

/** Rich lesson notes shown under the video. */
export type Note =
  | { type: "lead"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "cards"; items: { title: string; body: string; examples?: string[] }[] }
  | { type: "steps"; items: { title: string; body: string }[] }
  | { type: "callout"; title: string; body: string };

export type Lesson = {
  id: string;
  code: string; // the client's numbering, e.g. "2.3"
  slug: string; // URL segment, e.g. "2-3"
  title: string;
  summary: string;
  durationSec: number;
  notes: Note[];
  /** Video file or stream URL (MP4, or any URL the browser can play). Unset = stand-in player. */
  video?: string;
  /** Thumbnail (a frame from the video). Unset = the day's cover. */
  thumb?: string;
  /** Downloads shown under the notes, e.g. a gear list PDF. */
  resources?: Resource[];
};

export type Resource = { title: string; kind: "PDF" | "Checklist" | "Preset" | "Link"; href: string };

export type Module = {
  id: string;
  slug: string; // URL segment, e.g. "day-1"
  position: number;
  kind: "welcome" | "day" | "wrap";
  label: string; // "Welcome", "Day 1", "Wrap-up"
  title: string;
  summary: string;
  still: string; // cover image until real thumbnails exist
  lessons: Lesson[];
  quiz?: Quiz;
};

export type Instructor = {
  name: string;
  /** Portrait for the course page, e.g. "/people/duncan.jpg". */
  photo?: string;
  title: string;
  bio: string;
  initials: string;
  clients: string[];
};

export type Course = {
  id: string;
  slug: string;
  code: string; // used in certificate numbers, e.g. PHOTO
  status: "published" | "coming_soon";
  category: string; // shown on the catalog card, e.g. "Photography"
  cover: string; // catalog and course page image
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  level: string;
  price: number;
  currency: string;
  instructor: Instructor;
  outcomes: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  /** The certificate design students receive. */
  certificate: CertificateTemplate;
  modules: Module[];
};

export type Brand = {
  name: string;
  subtitle: string;
  organisation: string;
  email: string;
  whatsapp: string;
  website: string;
  bookingUrl: string;
};

/** One piece of text written onto the certificate template. Positions and sizes are fractions of the image width/height, so any resolution works. */
export type CertificateField = {
  x: number; // anchor point, 0–1 of width
  y: number; // vertical middle of the text, 0–1 of height
  size: number; // font size as a fraction of the image width
  align: "left" | "center" | "right";
  font: "display" | "sans" | "mono";
  weight?: number;
  color: string;
  /** Letter spacing in em (e.g. -0.035). */
  tracking?: number;
  /** Longest the text may be, as a fraction of width; longer names are scaled down to fit. */
  maxWidth?: number;
  uppercase?: boolean;
};

/** A certificate design: an image (e.g. exported from Canva) plus where to write each student's details. */
export type CertificateTemplate = {
  image: string; // e.g. "/certificates/the-prod.jpg"
  width: number; // pixel size of that image
  height: number;
  fields: {
    name: CertificateField;
    date: CertificateField;
    number?: CertificateField;
  };
  /** How the date is written, e.g. "18 September 2026". */
  dateFormat?: Intl.DateTimeFormatOptions;
};
