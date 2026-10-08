---
name: update-transcripts
description: Import or edit video transcripts (the Transcript tab on each lesson). Use when the user uploads a new transcript document (.docx/.txt), wants to fix words in a transcript, or after videos are re-recorded.
---

# Update transcripts

All paths are relative to `course-platform/`. Transcripts are plain text, one file per video: `content/transcripts/<course>/<code>.md` (video 2.3 → `2-3.md`), paragraphs separated by a blank line. The lesson page shows them under **Transcript**.

## Importing a new export

The client sends a YouTube-style export: a heading per video, "Search transcript" lines and timestamps.

```bash
python3 scripts/import-transcripts.py "<path>/export.docx" content/transcripts/the-prod
```

- Headings, "Search transcript" and timestamps are removed; the text becomes paragraphs.
- It prints each video's length (last timestamp + 5 s): copy changed lengths into the `seconds` argument of `lesson(...)` in `src/lib/content/the-prod/<day>.ts`.
- Known mishearings are fixed by the `FIXES` list at the top of the script (e.g. "infinity" → "Affinity"). Add new ones there so future imports keep them.
- Importing overwrites the files. Run `git diff content/transcripts` and keep any hand fixes that the import undid.

Download user uploads into their own empty folder and pass the path as an argument; don't run anything from inside it.

## Editing by hand

Edit the `.md` file directly. Keep it to plain paragraphs (no headings, no timestamps).

## What else may need updating

Transcripts are the source for the lesson notes and quizzes. If a re-recorded video says something different, follow the `edit-lessons-and-quizzes` skill to bring notes/quiz in line. Speaker names and brand names are often misheard (e.g. "Dan" for Duncan, "Bance mount" for Bowens mount); the notes use the correct spelling even when the transcript doesn't.

`content/REVIEW.md` lists places where the transcript was garbled or ambiguous and how the notes interpreted them; update it when the client confirms something.
