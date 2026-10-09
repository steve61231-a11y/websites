#!/usr/bin/env python3
"""Turn a transcript export (.docx or .txt) into one file per video.

    python3 scripts/import-transcripts.py <export.docx> content/transcripts/the-prod

The export is the YouTube-style transcript the client sends: a heading per
video ("Day 2 Day 2.3 - Camera Sensor ..."), "Search transcript" lines and
timestamps. Headings, "Search transcript" and timestamps are dropped; the text
is joined into paragraphs and written to <out>/<code>.md (2.3 -> 2-3.md).
The video length (last timestamp + 5 s) is printed so lesson durations can
be updated in src/lib/content/<course>/<day>.ts.

Known transcription fixes are applied (see FIXES). Review the diff before
committing: hand edits in existing files are overwritten.
"""
import html
import json
import re
import sys
import zipfile
from pathlib import Path

# Misheard words to correct everywhere. Add to this as you find more.
FIXES = [
    (r"\binfinity\b", "Affinity"),
    (r"\bAffiinity\b", "Affinity"),
]

HEADING = re.compile(
    r"^\s*(?:Introduction|Conclusion|Day \d+)?\s*(?:Day )?(\d+\.\d+|Training Conclusion)(?: Revised)?\s*(?:-\s*(.*))?$"
)
TIMESTAMP = re.compile(r"^\d+:\d{2}(?::\d{2})?$")
CONCLUSION_CODE = "8.1"

# Videos dropped or renumbered after the export was made: the original 6.2
# was replaced by the revised 6.3 and 6.4, which became 6.2 and 6.3.
RENUMBER: dict[str, str | None] = {"6.2": None, "6.3": "6.2", "6.4": "6.3"}


def read_lines(path: Path) -> list[str]:
    if path.suffix.lower() == ".docx":
        xml = zipfile.ZipFile(path).read("word/document.xml").decode()
        paras = re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)
        return ["".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)) for p in paras]
    return path.read_text().splitlines()


def main(src: str, out: str) -> None:
    out_dir = Path(out)
    out_dir.mkdir(parents=True, exist_ok=True)
    videos, cur = [], None
    for raw in read_lines(Path(src)):
        line = html.unescape(raw).strip()
        if not line or line == "Search transcript":
            continue
        m = HEADING.match(line)
        if m and len(line) < 80 and not TIMESTAMP.match(line):
            code = CONCLUSION_CODE if m.group(1) == "Training Conclusion" else m.group(1)
            code = RENUMBER.get(code, code)
            if code is None:
                cur = None  # skip this video's lines
                continue
            cur = {"code": code, "title": (m.group(2) or "Training Conclusion").strip(), "last": 0, "text": []}
            videos.append(cur)
            continue
        if cur is None:
            continue
        if TIMESTAMP.match(line):
            secs = 0
            for part in line.split(":"):
                secs = secs * 60 + int(part)
            cur["last"] = secs
            continue
        cur["text"].append(line)

    summary = []
    for v in videos:
        text = re.sub(r"\s+", " ", " ".join(v["text"])).strip()
        for pattern, repl in FIXES:
            text = re.sub(pattern, repl, text, flags=re.I)
        paragraphs, buf = [], ""
        for sentence in re.split(r"(?<=[.!?])\s+", text):
            buf = f"{buf} {sentence}".strip()
            if len(buf) > 520:
                paragraphs.append(buf)
                buf = ""
        if buf:
            paragraphs.append(buf)
        (out_dir / f"{v['code'].replace('.', '-')}.md").write_text("\n\n".join(paragraphs) + "\n")
        summary.append({"code": v["code"], "title": v["title"], "seconds": v["last"] + 5})

    print(json.dumps(summary, indent=1))
    print(f"\n{len(summary)} videos written to {out_dir}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
