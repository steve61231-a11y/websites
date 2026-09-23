"""Edit config/sources.yaml from the dashboard without destroying its comments.

Items are located by their ``- name:`` line; an item ends at the next item, a blank
line, or an item-level comment. Every edit is validated before it is written.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

from app.config import SOURCE_TYPES, load_sources, parse_source, sources_path

_ITEM = re.compile(r"^(\s*)-\s+name:\s*(.+?)\s*$")


def _name(raw: str) -> str:
    return raw.strip().strip('"').strip("'")


def _find_block(lines: list[str], name: str) -> tuple[int, int] | None:
    for i, line in enumerate(lines):
        m = _ITEM.match(line)
        if m and _name(m.group(2)) == name:
            indent = len(m.group(1))
            j = i + 1
            while j < len(lines):
                nxt = lines[j]
                if not nxt.strip() or _ITEM.match(nxt):
                    break
                stripped = nxt.lstrip()
                if stripped.startswith("#") and len(nxt) - len(stripped) <= indent:
                    break
                j += 1
            return i, j
    return None


def _validate_and_write(text: str, path: Path) -> None:
    data = yaml.safe_load(text) or {}
    for raw in data.get("sources", []) or []:
        parse_source(raw)  # raises on invalid entries
    tmp = path.with_suffix(".yaml.tmp")
    tmp.write_text(text, encoding="utf-8")
    load_sources(tmp, include_disabled=True)
    tmp.replace(path)


def add_source(name: str, stype: str, url: str, category: str, priority: int, extra: dict | None = None,
               path: Path | None = None) -> None:
    path = path or sources_path()
    if stype not in SOURCE_TYPES:
        raise ValueError(f"unknown type {stype}")
    if any(s.name == name for s in load_sources(path, include_disabled=True)):
        raise ValueError(f"a source named {name!r} already exists")
    entry = {"name": name, "type": stype, "url": url, "category": category, "priority": int(priority), **(extra or {})}
    parse_source(entry)
    block = yaml.safe_dump([entry], sort_keys=False, allow_unicode=True, width=200)
    block = "\n".join("  " + line if line else line for line in block.splitlines())
    text = path.read_text(encoding="utf-8").rstrip("\n") + "\n\n" + block + "\n"
    _validate_and_write(text, path)


def set_enabled(name: str, enabled: bool, path: Path | None = None) -> None:
    path = path or sources_path()
    lines = path.read_text(encoding="utf-8").splitlines()
    span = _find_block(lines, name)
    if not span:
        raise ValueError(f"source {name!r} not found")
    start, end = span
    indent = len(_ITEM.match(lines[start]).group(1)) + 2
    for k in range(start + 1, end):
        if re.match(r"^\s*enabled:", lines[k]):
            if enabled:
                del lines[k]
            else:
                lines[k] = " " * indent + "enabled: false"
            break
    else:
        if not enabled:
            lines.insert(start + 1, " " * indent + "enabled: false")
    _validate_and_write("\n".join(lines) + "\n", path)


def remove_source(name: str, path: Path | None = None) -> None:
    path = path or sources_path()
    lines = path.read_text(encoding="utf-8").splitlines()
    span = _find_block(lines, name)
    if not span:
        raise ValueError(f"source {name!r} not found")
    start, end = span
    if end < len(lines) and not lines[end].strip():
        end += 1  # swallow the separating blank line
    del lines[start:end]
    _validate_and_write("\n".join(lines) + "\n", path)
