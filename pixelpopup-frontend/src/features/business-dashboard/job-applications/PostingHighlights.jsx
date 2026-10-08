import { useMemo, useState } from "react";
import { ChevronDown, FileSearch, Info } from "lucide-react";
import { Badge } from "../../personal-dashboard/ui/badge";
import { Button } from "../../personal-dashboard/ui/button";

// Local reading aids, not a qualification check or another paid AI request.
const keywords = [
  "JavaScript", "TypeScript", "React", "React.js", "Next.js", "Vue", "Vue.js", "Nuxt", "Angular", "Svelte",
  "Node.js", "NodeJS", "Python", "Django", "Flask", "FastAPI", "PHP", "Laravel", "Java", "Spring Boot", "C#", "C++", "ASP.NET", ".NET", "Golang", "Ruby", "Rails",
  "HTML", "CSS", "Tailwind", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST", "API", "APIs",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Playwright", "Cypress", "Jest", "Figma",
  "accessibility", "responsive design", "unit testing", "automated testing", "code review", "system design", "Agile", "Scrum",
  "leadership", "mentoring", "communication", "stakeholders", "project management", "English",
  "remote", "hybrid", "on-site", "full-time", "part-time", "contract", "freelance", "timezone",
  "required", "must have", "preferred", "nice to have",
];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractHighlights(posting, requirements) {
  const candidates = [...keywords,
    ...requirements.map((item) => item.text?.trim()).filter((text) => text && text.length <= 80),
    ...(posting.match(/\b\d+(?:\s*[-–]\s*\d+)?\+?\s+years?(?:\s+of)?\s+experience\b/gi) || []),
  ];
  const unique = [...new Map(candidates.map((text) => [text.toLowerCase(), text])).values()]
    .sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${unique.map(escape).join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  const chunks = [], terms = new Map();
  let end = 0;
  for (const match of posting.matchAll(pattern)) {
    const start = match.index + match[1].length;
    chunks.push({ text: posting.slice(end, start) }, { text: match[2], highlighted: true });
    terms.set(match[2].toLowerCase(), match[2]);
    end = start + match[2].length;
  }
  chunks.push({ text: posting.slice(end) });
  return { chunks, terms: [...terms.values()] };
}

export default function PostingHighlights({ posting = "", requirements = [], compact = false, variant = "document", showSummary = true, collapsible = false }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { chunks, terms } = useMemo(() => extractHighlights(posting, requirements), [posting, requirements]);
  const tagLimit = compact ? 6 : 10;
  if (!posting.trim()) return null;
  if (variant === "tags") return <section aria-label="Relevant keywords in the job posting" className="mt-3 space-y-2">
    {terms.length ? <>
      <div className="flex flex-wrap items-center gap-1.5">{terms.slice(0, tagLimit).map((term) => <Badge key={term} variant="outline" className="max-w-full whitespace-normal break-words rounded-md border-blue-100 bg-blue-50 text-blue-900">{term}</Badge>)}{compact && terms.length > tagLimit && <span className="text-xs text-slate-500">+{terms.length - tagLimit} more</span>}</div>
      {!compact && terms.length > tagLimit && <details className="text-xs text-slate-600"><summary className="cursor-pointer rounded-sm hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Show {terms.length - tagLimit} more keywords</summary><div className="mt-2 flex flex-wrap gap-1.5">{terms.slice(tagLimit).map((term) => <Badge key={term} variant="outline" className="max-w-full whitespace-normal break-words rounded-md border-blue-100 bg-blue-50 text-blue-900">{term}</Badge>)}</div></details>}
      <p className={compact ? "sr-only" : "text-xs text-slate-600"}>Keywords from the posting—not verified applicant skills.</p>
    </> : <p className="text-xs text-slate-600">No common keywords detected. Review the complete job description.</p>}
  </section>;
  const text = <p className={`whitespace-pre-wrap break-words text-sm leading-7 text-slate-800 ${compact ? "max-h-64 overflow-y-auto pr-2" : ""} ${collapsible && !expanded ? "line-clamp-6" : ""}`}>{chunks.map((chunk, index) => chunk.highlighted ? <mark key={index} className="rounded-sm bg-blue-100 px-0.5 text-blue-950">{chunk.text}</mark> : chunk.text)}</p>;
  return <section aria-label="Job description highlights" className="space-y-3">
    {showSummary && <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-950">
      <p className="flex items-center gap-2 text-sm font-medium"><FileSearch size={17} aria-hidden="true"/>Relevant terms in this posting</p>
      <p className="mt-2 break-words text-sm leading-6">{terms.length ? terms.slice(0, 18).join(", ") : "No common terms detected. Read the complete description and assess its requirements."}</p>
      {terms.length > 18 && <details className="mt-2 text-sm"><summary className="cursor-pointer hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">Show {terms.length - 18} more terms</summary><p className="mt-2 break-words leading-6">{terms.slice(18).join(", ")}</p></details>}
      <p className="mt-2 flex items-start gap-2 text-xs leading-5"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true"/>Local keyword highlights help you read the posting. They are not evidence that you meet its requirements; the original text is unchanged.</p>
    </div>}
    {compact ? <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-md border bg-white p-3"><summary className="cursor-pointer text-sm font-medium hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">Review highlighted description</summary><div className="mt-3">{text}</div></details> : text}
    {collapsible && <Button size="sm" variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><ChevronDown size={14} className={expanded ? "rotate-180" : ""}/>{expanded ? "Show less" : "Show full description"}</Button>}
  </section>;
}
