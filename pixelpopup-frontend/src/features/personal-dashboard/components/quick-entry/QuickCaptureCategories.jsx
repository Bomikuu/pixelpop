import { useRef, useState } from "react";
import { ChevronRight, Ellipsis } from "lucide-react";
import { Input } from "../../ui/input";
import { choiceIcon } from "../../lib/presets";

const preferences = {
  expense: [["food"], ["shopping"], ["transportation", "transport"], ["housing", "bills"]],
  income: [["income"], ["work"], ["family"], ["other", "others"]],
};
const other = { id: null, name: "Other" };

export default function QuickCaptureCategories({ categories, kind, value, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const more = useRef(null);
  const options = [other, ...categories.filter((category) => !["other", "others"].includes(category.name.toLowerCase()))];
  const shortcuts = [];
  for (const names of preferences[kind]) {
    const category = options.find((item) => names.includes(item.name.toLowerCase()) && !shortcuts.includes(item));
    if (category) shortcuts.push(category);
  }
  for (const category of options) {
    if (shortcuts.length >= 4) break;
    if (!shortcuts.includes(category)) shortcuts.push(category);
  }
  const selected = options.find((category) => category.id === value) || other;
  if (!shortcuts.includes(selected)) shortcuts[Math.min(shortcuts.length, 3)] = selected;

  function choose(category, fromList = false) {
    onChange(category.id);
    setExpanded(false);
    setQuery("");
    if (fromList) requestAnimationFrame(() => more.current?.focus());
  }
  function categoryButton(category, fromList = false) {
    const Icon = choiceIcon(category.name.toLowerCase(), category.name);
    return <button key={category.id ?? "other"} type="button" className="capture-category" disabled={disabled} aria-pressed={category.id === value} onClick={() => choose(category, fromList)}>
      <Icon size={19} aria-hidden="true" /><span>{category.name === "Transportation" ? "Transport" : category.name}</span>
    </button>;
  }
  return <section className="capture-categories" aria-label="Category">
    <div className="capture-category-heading"><h3>Category</h3><button type="button" disabled={disabled} aria-expanded={expanded} aria-controls="quick-capture-all-categories" onClick={() => setExpanded((current) => !current)}>{expanded ? "Show less" : "See all"}<ChevronRight size={15} aria-hidden="true" /></button></div>
    <div className="capture-category-shortcuts" role="group" aria-label="Category shortcuts" style={{ gridTemplateColumns: `repeat(${shortcuts.length + 1}, minmax(0, 1fr))` }}>
      {shortcuts.map((category) => categoryButton(category))}
      <button ref={more} type="button" className="capture-category" disabled={disabled} aria-expanded={expanded} aria-controls="quick-capture-all-categories" onClick={() => setExpanded((current) => !current)}><Ellipsis size={19} aria-hidden="true" /><span>More</span></button>
    </div>
    {expanded && <div id="quick-capture-all-categories" className="capture-category-picker">
      <Input type="search" aria-label="Find a category" placeholder="Find a category" value={query} disabled={disabled} onChange={(event) => setQuery(event.target.value)} />
      <div className="capture-category-list" role="group" aria-label="All categories">{options.filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase())).map((category) => categoryButton(category, true))}</div>
      {!options.some((category) => category.name.toLowerCase().includes(query.trim().toLowerCase())) && <p role="status">No matching categories.</p>}
    </div>}
  </section>;
}
