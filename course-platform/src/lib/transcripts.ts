import { readFile } from "node:fs/promises";
import path from "node:path";
import { toParagraphs } from "./transcripts-text";

// Video transcripts live as plain text in /content/transcripts/<course>/<code>.md
// (e.g. 2-3.md for video 2.3), one paragraph per blank-line-separated block.
// Edit those files directly; the lesson page picks the change up on the next build.

export async function getTranscript(courseId: string, lessonSlug: string): Promise<string[] | null> {
  "use cache";
  try {
    const file = path.join(process.cwd(), "content", "transcripts", courseId, `${lessonSlug}.md`);
    return toParagraphs(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}
