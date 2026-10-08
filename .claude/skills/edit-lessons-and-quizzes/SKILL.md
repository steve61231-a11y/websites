---
name: edit-lessons-and-quizzes
description: Write or change lesson notes, lesson titles, day quizzes or the final assessment. Use when the user wants notes rewritten, a quiz made easier/harder, questions added or fixed, a lesson renamed, or content regenerated from transcripts.
---

# Edit lesson notes and quizzes

All paths are relative to `course-platform/`.

## Where things are

```
src/lib/content/the-prod/
  index.ts      the course: day titles, summaries, covers, price, instructor, FAQs
  welcome.ts    Introduction (0.1, 0.2), no quiz
  day-1.ts … day-7.ts   each day's videos and its quiz
  wrap-up.ts    Conclusion (8.1) and the final assessment
  media.ts      video links and downloads
src/lib/content/helpers.ts   lesson(), ask(), truth(), quiz() builders
src/lib/types.ts             Note block types
content/transcripts/the-prod/<code>.md   source text for every video
```

Each day file exports `lessons` and (if it has one) `quiz`.

## Lessons

```ts
lesson("2.3", "Camera Sensor: Full Frame or Cropped", 101, "One-line summary for the list.", [
  { type: "lead", text: "The key idea in one or two sentences." },
  { type: "heading", text: "Section" },
  { type: "paragraph", text: "…" },
  { type: "list", items: ["…", "…"] },
  { type: "steps", items: [{ title: "Step", body: "…" }] },
  { type: "cards", items: [{ title: "Option", body: "…", examples: ["…"] }] },
  { type: "callout", title: "Tip", body: "…" },
])
```

- Arguments: video number, title, length in seconds, summary, note blocks. The number decides the URL (`/learn/day-2/2-3`); don't change it unless the videos are renumbered.
- Notes must teach what the video actually says (read the transcript first). Don't invent prices, models or claims. Fix misheard names silently (see `content/REVIEW.md`).
- Start with a `lead`. Short videos: 2–4 blocks; long ones up to ~10.

## Quizzes

```ts
export const quiz: Quiz = makeQuiz("q-day-2", "Gear Recommendations", [
  ask("d2-1", "Question?", [["Wrong"], ["Right", true], ["Wrong"], ["Wrong"]], "Why, tied to the lesson."),
  ask("d2-2", "What should you do?", [...], "Explanation.", "Scenario: one practical sentence shown above the question."),
  truth("d2-3", "A statement.", false, "Why."),
]);   // optional 4th arg: passingScore, default 0.7
```

Rules the client asked for:
- Test the **important, practical** points (would this help them on a real shoot?), not trivia, client names or numbers that were garbled.
- Fair, not tricky: a student who watched attentively passes; one who didn't shouldn't. All options plausible, exactly one correct, **vary the position** of the right answer.
- Day quizzes: about 5–8 questions; the final (`q-final` in `wrap-up.ts`) ~12 questions spread across all days, at least 4 scenarios.
- Keep question ids unique within a quiz (`d2-1`, `d2-2` …, `f-1` …). Changing a quiz `id` resets everyone's progress on it.

## After editing

```bash
npx tsc --noEmit -p . && npx eslint src/lib/content
```

Then click through the changed lesson and quiz (see `check-and-publish`). Account → Demo controls can jump ahead to test later days.
