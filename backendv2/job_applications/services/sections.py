"""Lossless section boundaries; an ambiguous source is compared as a whole."""
import re
from collections import defaultdict
from difflib import SequenceMatcher


def split_sections(body):
    lines = body.splitlines(keepends=True)
    headings = []
    fence = None
    for index, line in enumerate(lines):
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker:
            char = marker[1][0]
            if fence is None:
                fence = (char, len(marker[1]))
            elif char == fence[0] and len(marker[1]) >= fence[1]:
                fence = None
            continue
        match = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", line.rstrip("\r\n"))
        if match and fence is None:
            headings.append((index, len(match[1]), match[2]))
    # H1 commonly holds the name; H2 defines résumé sections. Otherwise use
    # the shallowest repeated heading level without guessing from plain text.
    levels = [level for _, level, _ in headings]
    level = 2 if 2 in levels else min(levels, default=0)
    boundaries = [(index, title) for index, depth, title in headings if depth == level]
    if not boundaries:
        return [{"title": "Whole document", "body": body, "key": "document:1"}] if body else []
    if boundaries[0][0] > 0:
        boundaries.insert(0, (0, "Header & introduction"))
    counts = defaultdict(int)
    sections = []
    for position, (start, title) in enumerate(boundaries):
        end = boundaries[position + 1][0] if position + 1 < len(boundaries) else len(lines)
        name = " ".join(title.casefold().split())
        counts[name] += 1
        sections.append({"title": title, "body": "".join(lines[start:end]), "key": f"{name}:{counts[name]}"})
    return sections


def compare_sections(original, proposed):
    before, after = split_sections(original), split_sections(proposed)
    if any(section["key"] == "document:1" for section in before + after) or len(before) + len(after) > 80:
        before = [{"title": "Whole document", "body": original, "key": "document:1"}] if original else []
        after = [{"title": "Whole document", "body": proposed, "key": "document:1"}] if proposed else []
    rows = []

    def append(old, new):
        old_body, new_body = old["body"] if old else "", new["body"] if new else ""
        change = "unchanged" if old and new and old_body == new_body else "changed" if old and new else "added" if new else "removed"
        rows.append({"id": f"section-{len(rows) + 1}", "title": (new or old)["title"],
                     "original": old_body, "proposed": new_body, "change": change,
                     "decision": "original" if change == "unchanged" else "unreviewed"})

    matcher = SequenceMatcher(a=[item["key"] for item in before], b=[item["key"] for item in after], autojunk=False)
    for operation, a0, a1, b0, b1 in matcher.get_opcodes():
        if operation == "equal":
            for old, new in zip(before[a0:a1], after[b0:b1]):
                append(old, new)
        else:
            for old in before[a0:a1]:
                append(old, None)
            for new in after[b0:b1]:
                append(None, new)
    return rows


def assemble_sections(sections):
    # Keep each raw section intact; separating mixed sources prevents a heading
    # merging into the final line of a section that had no trailing newline.
    return "\n\n".join(item[item["decision"]].rstrip() for item in sections if item["decision"] in ("original", "proposed") and item[item["decision"]].strip())
