import { useState } from "react";
import { FileText, Info } from "lucide-react";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { focusInvalidField } from "./api";
import { sectionContent } from "./documentSections";
import { resumeSectionTemplates } from "./resumeSectionTemplates";

export default function ResumeSectionForm({ section, sourceSections = [], initialValues, onCancel, onApply }) {
  const plain = section && ["Whole document", "Header & introduction"].includes(section.title);
  const [initial] = useState(() => ({ template: "custom", title: section?.title || initialValues?.title || "", content: section ? sectionContent(section) : initialValues?.content || "" }));
  const [draft, setDraft] = useState(initial), [errors, setErrors] = useState({}), [error, setError] = useState("");
  const sourceTemplates = sourceSections.filter((item) => !["Whole document", "Header & introduction"].includes(item.title)).map((item) => ({ value: `source:${item.key}`, label: `From my résumé · ${item.title}`, title: item.title, icon: FileText, content: sectionContent(item) }));
  const templates = [...resumeSectionTemplates, ...sourceTemplates];
  const set = (name, value) => setDraft((previous) => ({ ...previous, [name]: value }));
  function selectTemplate(name, value) {
    const template = templates.find((item) => item.value === value);
    if (!template) return;
    setDraft((previous) => {
      const old = templates.find((item) => item.value === previous.template);
      return { ...previous, template: value, title: value === "custom" ? previous.title : template.title || template.label,
        content: !previous.content.trim() || previous.content === old?.content ? template.content : previous.content };
    });
    setErrors({}); setError("");
  }
  function submit(event) {
    event.preventDefault(); setErrors({}); setError("");
    const invalid = {};
    if (!plain && (!draft.title.trim() || /[\r\n]/.test(draft.title))) invalid.title = "Enter a section heading on one line.";
    else if (!plain && draft.title.trim().length > 160) invalid.title = "Use a heading of at most 160 characters.";
    if (!draft.content.trim()) invalid.content = "Add this section's content.";
    if (Object.keys(invalid).length) { setErrors(invalid); focusInvalidField(event.currentTarget); return; }
    const heading = section?.body.match(/^(#{1,6})\s+/)?.[1] || "##";
    const text = plain ? draft.content : `${heading} ${draft.title.trim()}\n\n${draft.content}`;
    const issue = onApply(text);
    if (issue) setError(issue);
  }
  return <FormModalShell title={section ? `Edit ${section.title}` : initialValues ? "Duplicate résumé section" : "Add résumé section"} description="Applies only to your unsaved draft. Save draft afterward, then review it before exporting." onSubmit={submit} onCancel={onCancel} dirty={JSON.stringify(draft) !== JSON.stringify(initial) || (!section && !!draft.content.trim())} submitDisabled={!!section && JSON.stringify(draft) === JSON.stringify(initial)} error={error} saveLabel="Apply to draft">
    {!section && !initialValues && <FormField field={{ name: "template", label: "Section template", type: "select", hint: "Start from a template or restore a section from your reviewed résumé. Everything is editable. Replace placeholders with real facts; switching templates keeps content you have written." }} options={templates} values={draft} onChange={selectTemplate} layout="plain" idPrefix="resume-section"/>}
    {!plain && <FormField field={{ name: "title", label: "Section heading", type: "text", required: true, maxLength: 160, placeholder: "e.g. Professional experience" }} values={draft} onChange={set} layout="plain" idPrefix="resume-section" error={errors.title}/>}
    <MarkdownEditor id="resume-section-content" value={draft.content} onChange={(value) => set("content", value)} label="Section content" maxLength={30000} invalid={!!errors.content} describedBy={errors.content ? "resume-section-content-error" : undefined}/>
    {errors.content && <p id="resume-section-content-error" role="alert" className="text-sm text-red-800">{errors.content}</p>}
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0"/>Contact details come from your reviewed profile. For dated entries, use a heading such as “### Software developer” followed by the actual dates on their own line. Keep claims factual.</p>
  </FormModalShell>;
}
