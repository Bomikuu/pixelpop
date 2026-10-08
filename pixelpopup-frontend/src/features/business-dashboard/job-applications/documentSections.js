// Mirror the server's Markdown heading boundaries; preserve all other text.
export function documentSections(body) {
  const lines = body.match(/[^\n]*\n|[^\n]+$/g) || [];
  const headings = [];
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
      return;
    }
    const match = line.trimEnd().match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match && !fence) headings.push({ index, depth: match[1].length, title: match[2] });
  });
  const level = headings.some((item) => item.depth === 2) ? 2 : Math.min(...headings.map((item) => item.depth));
  const boundaries = headings.filter((item) => item.depth === level);
  if (!boundaries.length) return body ? [{ id: "document", key: "document:1", title: "Whole document", body }] : [];
  if (boundaries[0].index > 0) boundaries.unshift({ index: 0, title: "Header & introduction" });
  const counts = new Map();
  return boundaries.map((item, index) => {
    const name = item.title.toLowerCase().trim().replace(/\s+/g, " ");
    const count = (counts.get(name) || 0) + 1;
    counts.set(name, count);
    return { id: `document-${index}`, key: `${name}:${count}`, title: item.title, body: lines.slice(item.index, boundaries[index + 1]?.index ?? lines.length).join("") };
  });
}

export function sectionContent(section) {
  return ["Whole document", "Header & introduction"].includes(section.title) ? section.body : section.body.replace(/^#{1,6}\s+[^\r\n]+(?:\r?\n)?/, "");
}

// Only explicit dated entry headings use the left date column. Everything else
// stays in the content, including unstructured text and fenced examples.
export function datedResumeEntries(body) {
  const lines = body.match(/[^\n]*\n|[^\n]+$/g) || [];
  const boundaries = [];
  const datePattern = /^(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(?:19|20)\d{2}|Present|Current))?$/i;
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    const dated = line.trimEnd().match(/^###\s+([^|]+?)\s*\|\s*(.+?)\s*#*\s*$/);
    if (dated && /\b(?:19|20)\d{2}\b/.test(dated[1])) {
      boundaries.push({ index, date: dated[1].trim(), title: dated[2], contentIndex: index + 1 }); return;
    }
    const heading = line.trimEnd().match(/^###\s+(.+?)\s*#*\s*$/);
    if (!heading) return;
    let next = index + 1;
    while (next < lines.length && !lines[next].trim()) next += 1;
    const date = datePattern.test(lines[next]?.trim() || "") ? lines[next].trim() : "";
    boundaries.push({ index, date, title: heading[1], contentIndex: date ? next + 1 : index + 1 });
  });
  if (!boundaries.some((item) => item.date)) return null;
  if (boundaries[0].index > 0) boundaries.unshift({ index: 0, date: "", title: "", contentIndex: 0 });
  return boundaries.map((item, index) => ({ ...item, id: `entry-${index}`, body: lines.slice(item.contentIndex, boundaries[index + 1]?.index ?? lines.length).join("") }));
}
