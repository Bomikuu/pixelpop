import { Check, ChevronDown, Code2, Info, Plus } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { skillGroups } from "./skillCatalog";

const MAX_FACTS_LENGTH = 30000;

export default function ProfileSkillSuggestions({ facts = "", onChange, disabled = false }) {
  const lines = facts.split("\n");
  function toggle(line) {
    if (lines.includes(line)) {
      onChange(lines.filter((item) => item !== line).join("\n"));
    } else {
      const next = facts ? `${facts}${facts.endsWith("\n") ? "" : "\n"}${line}` : line;
      if (next.length <= MAX_FACTS_LENGTH) onChange(next);
    }
  }

  return <section className="mb-4 space-y-3" aria-labelledby="applicant-skill-suggestions">
    <h3 id="applicant-skill-suggestions" className="flex items-center gap-2 text-sm font-semibold"><Code2 size={17} aria-hidden="true"/>Skill & project suggestions</h3>
    <p id="applicant-skill-help" className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true"/>Choose skills and systems you have worked with. Tags add editable lines below; they do not establish proficiency, project contributions, or years of experience. Add other tools directly in the experience field.</p>
    <div className="divide-y rounded-md border bg-white">
      {skillGroups.map(({ label, prefix, icon: Icon, options }, index) => {
        const selected = options.filter((option) => lines.includes(`${prefix}: ${option}`)).length;
        return <details key={label} open={index === 0} className="group/skills">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--pd-soft)] focus-visible:outline-2 focus-visible:outline-[var(--pd-primary)] [&::-webkit-details-marker]:hidden">
            <Icon size={16} className="text-[var(--pd-primary)]" aria-hidden="true"/>{label}
            <span className="ml-auto text-xs font-normal text-slate-600">{selected ? `${selected} added` : "Suggestions"}</span>
            <ChevronDown size={16} className="group-open/skills:rotate-180" aria-hidden="true"/>
          </summary>
          <div className="flex flex-wrap gap-2 px-3 pb-3" role="group" aria-label={`${label} suggestions`} aria-describedby="applicant-skill-help">
            {options.map((option) => {
              const line = `${prefix}: ${option}`;
              const active = lines.includes(line);
              const full = !active && facts.length + line.length + (facts && !facts.endsWith("\n") ? 1 : 0) > MAX_FACTS_LENGTH;
              return <Button key={option} type="button" variant="outline" size="sm" aria-pressed={active} disabled={disabled || full} onClick={() => toggle(line)} className={active ? "border-[var(--pd-primary)] bg-[var(--pd-soft)] text-[var(--pd-primary)]" : ""} title={full ? "Experience text is full. Shorten it before adding more skills." : undefined}>
                {active ? <Check size={14} aria-hidden="true"/> : <Plus size={14} aria-hidden="true"/>}{option}
              </Button>;
            })}
          </div>
        </details>;
      })}
    </div>
    <p className="text-xs leading-5 text-slate-600">Only lines added through these tags are toggled. Existing project descriptions stay unchanged. Save your profile to reuse these details across applications.</p>
  </section>;
}
