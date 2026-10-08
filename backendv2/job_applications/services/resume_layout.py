"""Explicit dated Markdown entries for the original résumé's date rail."""
import re


MONTH = r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
YEAR = r"(?:19|20)\d{2}"
DATE = re.compile(rf"^(?:{MONTH}\s+)?{YEAR}(?:\s*[-–—]\s*(?:(?:{MONTH}\s+)?{YEAR}|Present|Current))?$", re.I)


def dated_entries(body):
    """Match the preview's boundaries without inventing or dropping dates."""
    lines = body.splitlines(keepends=True)
    boundaries, fence = [], None
    for index, line in enumerate(lines):
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker:
            char = marker[1][0]
            if fence is None:
                fence = (char, len(marker[1]))
            elif char == fence[0] and len(marker[1]) >= fence[1]:
                fence = None
            continue
        if fence is not None:
            continue
        dated = re.match(r"^###\s+([^|]+?)\s*\|\s*(.+?)\s*#*\s*$", line.rstrip())
        if dated and re.search(r"\b(?:19|20)\d{2}\b", dated[1]):
            boundaries.append((index, dated[1].strip(), dated[2], index + 1))
            continue
        heading = re.match(r"^###\s+(.+?)\s*#*\s*$", line.rstrip())
        if not heading:
            continue
        following = index + 1
        while following < len(lines) and not lines[following].strip():
            following += 1
        candidate = lines[following].strip() if following < len(lines) else ""
        date = candidate if DATE.fullmatch(candidate) else ""
        boundaries.append((index, date, heading[1], following + 1 if date else index + 1))
    if not any(date for _, date, _, _ in boundaries):
        return None
    if boundaries[0][0] > 0:
        boundaries.insert(0, (0, "", "", 0))
    return [{"date": date, "title": title,
             "body": "".join(lines[content_start:boundaries[position + 1][0] if position + 1 < len(boundaries) else len(lines)])}
            for position, (_, date, title, content_start) in enumerate(boundaries)]
