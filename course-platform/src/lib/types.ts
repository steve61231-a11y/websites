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

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  durationSec: number;
  transcript: string[];
  resources?: { title: string; kind: "PDF" | "Checklist" | "Preset" }[];
};

export type Module = {
  id: string;
  position: number;
  title: string;
  summary: string;
  lessons: Lesson[];
  quiz?: Quiz;
};

export type Instructor = {
  name: string;
  title: string;
  bio: string;
  initials: string;
};

export type Course = {
  id: string;
  slug: string;
  code: string; // used in certificate numbers, e.g. PHOTO
  status: "published" | "coming_soon";
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  level: string;
  price: number;
  currency: string;
  instructor: Instructor;
  outcomes: { title: string; body: string }[];
  modules: Module[];
};

export type ComingSoon = {
  id: string;
  hint: string;
  hue: number;
};
