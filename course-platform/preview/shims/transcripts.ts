import { toParagraphs } from "@/lib/transcripts-text";

// The preview has no file system, so the transcripts are bundled in.
const files = import.meta.glob("../../content/transcripts/*/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function transcriptFor(courseId: string, lessonSlug: string) {
  const text = files[`../../content/transcripts/${courseId}/${lessonSlug}.md`];
  return text ? toParagraphs(text) : null;
}
