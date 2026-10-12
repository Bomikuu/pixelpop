import { FileCheck2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import ChoiceTiles from "../../personal-dashboard/components/ChoiceTiles";

export default function TailoringPreferences({ value, onChange, disabled, errors = {} }) {
  const groups = [
    { name: "tailoring_emphasis", label: "Tailoring emphasis", options: [{ value: "conservative", label: "Conservative", icon: ShieldCheck, description: "Restrained wording; keep existing experience emphasis." }, { value: "strong", label: "Strong", icon: Sparkles, description: "Prioritize relevant confirmed ASTA and independent contributions." }] },
    { name: "unconfirmed_claims", label: "Unconfirmed requirements", options: [{ value: "review_questions", label: "Ask one priority question", icon: MessageSquare, description: "Clarify the most important missing evidence before tailoring." }, { value: "exclude", label: "Exclude from résumé", icon: FileCheck2, description: "Tailor supported facts; keep gaps visible in preparation." }] },
  ];
  return <section className="space-y-4 border-t pt-4" aria-label="Résumé tailoring defaults"><h3 className="text-sm font-semibold">Résumé tailoring defaults</h3>{groups.map(({ name, label, options }) => <div key={name}><p className="mb-2 text-sm font-medium">{label}</p><ChoiceTiles id={`tailoring-${name}`} label={label} value={value[name] || options[0].value} options={options} onChange={(next) => onChange(name, next)} disabled={disabled} invalid={!!errors[name]} describedBy={errors[name] ? `tailoring-error-${name}` : undefined}/>{errors[name] && <p id={`tailoring-error-${name}`} role="alert" className="mt-2 text-sm text-red-800">{Array.isArray(errors[name]) ? errors[name].join(" ") : errors[name]}</p>}</div>)}<p className="text-xs leading-5 text-slate-600">Strong changes emphasis, not the facts. Hypothetical examples use a separate preparation proposal and never approve themselves.</p></section>;
}
