import type { Lesson, Note, Quiz, QuizQuestion } from "../types";

// Small builders that keep the course content files readable.

/** A video. `code` is the client's numbering ("2.3"); `seconds` is the video length. */
export function lesson(code: string, title: string, seconds: number, summary: string, notes: Note[]): Lesson {
  const slug = code.replace(".", "-");
  return { id: `l-${slug}`, code, slug, title, summary, durationSec: seconds, notes };
}

type Choice = [text: string, correct?: boolean];

/** A multiple-choice or scenario question. Mark the right option with `true`. */
export function ask(
  id: string,
  prompt: string,
  choices: Choice[],
  explanation: string,
  scenario?: string,
): QuizQuestion {
  return {
    id,
    type: scenario ? "scenario" : "multiple_choice",
    prompt,
    ...(scenario ? { scenario } : {}),
    options: choices.map(([text, correct], i) => ({ id: "abcdef"[i], text, correct: !!correct })),
    explanation,
  };
}

/** A true-or-false statement. */
export function truth(id: string, statement: string, isTrue: boolean, explanation: string): QuizQuestion {
  return {
    id,
    type: "true_false",
    prompt: statement,
    options: [
      { id: "t", text: "True", correct: isTrue },
      { id: "f", text: "False", correct: !isTrue },
    ],
    explanation,
  };
}

export function quiz(id: string, title: string, questions: QuizQuestion[], passingScore = 0.7): Quiz {
  return { id, title, passingScore, questions };
}
