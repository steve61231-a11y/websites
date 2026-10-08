/** Split a transcript file into paragraphs (blank-line separated). */
export function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
