import { useRef, useState } from "react";
import { CheckCircle2, Eye, EyeOff, FileUp, Link2, Info } from "lucide-react";
import { experience, education, projects, technologies } from "../../../pages/portfolio/portfolioData";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { fieldError, jobApi } from "./api";
import MarkdownEditor from "../client-workflow/MarkdownEditor";
import DocumentPage from "../client-workflow/DocumentPage";

export default function ApplicantProfileForm({ profile, onCancel, onSaved, notify }) {
  const [draft, setDraft] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef(null);
  const set = (name, value) => { setDraft((previous) => ({ ...previous, [name]: value, ...(name !== "sources_confirmed" ? { sources_confirmed: false } : {}) })); setErrors({}); setError(""); };
  async function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const data = await jobApi("resume/", { method: "POST", body });
      setDraft((previous) => ({ ...previous, ...data, sources_confirmed: false }));
      notify("Résumé text loaded. Review it before saving your profile.");
    } catch (issue) { setError(fieldError(issue.fields, "file") || issue.message); }
    finally { setUploading(false); event.target.value = ""; }
  }
  function usePortfolio() {
    const snapshot = ["Experience", ...experience.map((item) => `${item.company} | ${item.title} | ${item.period}\n${item.detail}`),
      "Education", ...education.map((item) => `${item.school} | ${item.program} | ${item.period}`),
      `Technology experience: ${technologies.map((item) => item.name).join(", ")}`,
      "Selected projects", ...projects.map((item) => `${item.title}: ${item.summary}\nRole: ${item.role || ""}\n${item.link || ""}\n${(item.outcomes || []).join("\n")}`)].join("\n\n");
    setDraft((previous) => ({ ...previous, full_name: previous.full_name || "Mico Ang", email: previous.email || "mico.dahang@gmail.com", portfolio_url: previous.portfolio_url || "https://pixelsbymiku.dev/portfolio", facts: previous.facts.includes(snapshot) ? previous.facts : previous.facts ? `${previous.facts}\n\nPortfolio snapshot\n${snapshot}` : snapshot, sources_confirmed: false }));
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setErrors({});
    try { const saved = await jobApi("profile/", { method: "PATCH", body: draft }); onSaved(saved); notify("Application profile saved."); }
    catch (issue) { setErrors(issue.fields || {}); setError(issue.message); }
    finally { setBusy(false); }
  }
  const fields = [{ name: "full_name", label: "Full name", type: "text" }, { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel", maxLength: 50 }, { name: "location", label: "Location", type: "text" },
    { name: "portfolio_url", label: "Portfolio URL", type: "url", maxLength: 200 },
    { name: "facts", label: "Experience, skills, projects & preferences", type: "textarea", maxLength: 30000, className: "min-h-52", hint: "Review your portfolio and ASTA experience. Include only facts you can support, plus any salary, availability, or work preferences you want answers to use." },
    { name: "resume_text", label: "Reviewed résumé text", type: "textarea", maxLength: 30000, className: "min-h-44", hint: draft.resume_filename ? `Imported from ${draft.resume_filename}. You can correct the extracted text.` : "Upload a résumé or paste its text. This supplements your experience above." }];
  return <FormModalShell title="Application profile" description="These are the sources used to prepare your applications. Review the facts and confirm them before generating. You can save unconfirmed work." error={error} busy={busy || uploading} dirty={JSON.stringify(draft) !== JSON.stringify(profile)} onSubmit={submit} onCancel={onCancel} saveLabel="Save profile">
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy || uploading} onClick={usePortfolio}><Link2 size={16} />Use my portfolio & ASTA experience</Button><Button type="button" variant="outline" disabled={busy || uploading} onClick={() => fileRef.current?.click()}><FileUp size={16}/>{uploading ? "Reading résumé…" : "Upload résumé"}</Button><Input ref={fileRef} type="file" accept=".pdf,.docx,.txt" aria-label="Upload résumé" className="sr-only" onChange={upload} tabIndex={-1} /></div>
    <div className="grid gap-4 sm:grid-cols-2">{fields.filter((field) => field.name !== "resume_text").map((field) => <div key={field.name} className={field.type === "textarea" || field.name === "portfolio_url" ? "sm:col-span-2" : ""}><FormField field={field} values={draft} onChange={set} layout="plain" idPrefix="applicant" error={fieldError(errors, field.name)} disabled={busy || uploading}/></div>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p id="applicant-resume-hint" className="text-xs text-slate-600">{draft.resume_filename ? `Imported from ${draft.resume_filename}. You can correct and format the extracted text.` : "Upload your résumé or paste and format its text below."}</p>
      <Button type="button" size="sm" variant="outline" aria-expanded={previewOpen} aria-controls="applicant-resume-preview" onClick={() => setPreviewOpen((open) => !open)}>{previewOpen ? <EyeOff size={15}/> : <Eye size={15}/>} {previewOpen ? "Hide preview" : "Show preview"}</Button>
    </div>
    <div className={`grid min-w-0 gap-5 ${previewOpen ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "xl:grid-cols-1"}`}>
      <fieldset disabled={busy || uploading} className="min-w-0">
        <MarkdownEditor id="applicant-resume_text" label="Reviewed résumé text (Markdown)" required={false} maxLength={30000} value={draft.resume_text} onChange={(text) => set("resume_text", text)} invalid={!!fieldError(errors, "resume_text")} describedBy={`applicant-resume-hint${fieldError(errors, "resume_text") ? " applicant-resume-error" : ""}`}/>
        {fieldError(errors, "resume_text") && <p id="applicant-resume-error" role="alert" className="mt-1 text-sm text-red-800">{fieldError(errors, "resume_text")}</p>}
      </fieldset>
      <section id="applicant-resume-preview" aria-label="Live résumé preview" className={`min-w-0 overflow-hidden border border-slate-200 bg-slate-100/70 p-2 sm:p-4 ${previewOpen ? "block" : "hidden"}`}><DocumentPage body={draft.resume_text} allowImages={false}/></section>
    </div>
    <section className={`space-y-3 rounded-md border p-4 ${draft.sources_confirmed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`} aria-label="Required source confirmation">
      <h3 className="flex items-center gap-2 text-sm font-semibold">{draft.sources_confirmed ? <CheckCircle2 size={18} className="text-emerald-800" aria-hidden="true"/> : <Info size={18} className="text-amber-800" aria-hidden="true"/>}{draft.sources_confirmed ? "Sources checked—save your profile" : "Required before AI generation"}</h3>
      <p id="applicant-confirmation-help" className="text-sm leading-6 text-slate-700">Review the facts above, tick this confirmation, then choose <strong>Save profile</strong>. An API key alone does not unlock AI Assist. You can still save unfinished work without confirming it.</p>
      <div className="flex items-start gap-3"><input type="checkbox" id="applicant-confirmed" aria-describedby="applicant-confirmation-help applicant-confirmation-reset" className="mt-1 size-4 shrink-0 accent-blue-600" checked={draft.sources_confirmed} onChange={(event) => set("sources_confirmed", event.target.checked)} disabled={busy || uploading}/><label htmlFor="applicant-confirmed" className="text-sm font-medium leading-6">I have reviewed these sources and confirm they accurately describe my experience.</label></div>
      <p id="applicant-confirmation-reset" className="text-xs leading-5 text-slate-600">Editing profile details or uploading a résumé resets this confirmation. Review, confirm and save again afterward.</p>
    </section>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0"/>PDF, Word (.docx), and UTF-8 text, up to 5 MB. Only extracted text is saved; the uploaded file is discarded.</p>
  </FormModalShell>;
}
