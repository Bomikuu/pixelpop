import { useState } from "react";
import { ClipboardCheck, Info } from "lucide-react";
import FormField from "../../personal-dashboard/components/forms/FormField";
import FormModalShell from "../../personal-dashboard/components/forms/FormModalShell";
import { fieldError, focusInvalidField, jobApi } from "./api";

const hints = { rate: "Check the requested or offered rate, currency and payment basis.", availability: "Check the schedule, timezone and when you can start.", accuracy: "Check contact details, company, dates, claims and the actual attachments you will submit." };

export default function SubmissionReviewForm({ record, onCancel, onSaved, notify }) {
  const [review] = useState(record.submission_review);
  const [initial] = useState(() => Object.fromEntries(review.checks.map((item) => [item.id, { state: item.state, note: item.note }])));
  const [draft, setDraft] = useState(initial), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  const [error, setError] = useState(""), [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault(); if (busy || saved) return; const form = event.currentTarget; setError(""); setErrors({});
    const invalid = Object.fromEntries(Object.entries(draft).filter(([, value]) => value.state === "not_applicable" && !value.note.trim()).map(([key]) => [key, { note: "Explain why this is not applicable." }]));
    if (Object.keys(invalid).length) { setErrors(invalid); focusInvalidField(form); return; }
    setBusy(true);
    try {
      await jobApi(`applications/${record.id}/submission-review/`, { method: "POST", body: { expected_version: review.version, review_digest: review.review_digest, checks: draft } });
      setSaved(true); notify("Final checks saved. No submission was recorded."); await onSaved();
    } catch (issue) { setError(issue.message); setErrors(issue.fields?.checks || {}); focusInvalidField(form); }
    finally { setBusy(false); }
  }
  return <FormModalShell title="Final submission checks" description="Review these yourself. AI cannot confirm your rates, availability or final accuracy." onSubmit={submit} onCancel={onCancel} busy={busy} submitDisabled={saved} dirty={!saved && JSON.stringify(draft) !== JSON.stringify(initial)} error={error} saveLabel="Save final checks">
    {review.stale && <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><Info size={17} className="shrink-0" />Sources or documents changed. Your notes are retained, but each confirmation needs review again.</p>}
    {review.checks.map((item) => {
      const stateOptions = [
        { value: "needs_review", label: "Needs review" },
        { value: "confirmed", label: "Checked by me" },
      ];

      if (item.id !== "accuracy") {
        stateOptions.push({
          value: "not_applicable",
          label: "Not applicable",
        });
      }

      const handleChange = (name, value) => {
        setDraft((previous) => ({
          ...previous,
          [item.id]: {
            ...previous[item.id],
            [name]: value,
          },
        }));
      };

      return (
        <section
          key={item.id}
          className="space-y-3 border-b pb-4 last:border-0"
        >
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <ClipboardCheck size={17} />
            {item.label}
          </h3>

          <p className="text-xs text-slate-600">
            {hints[item.id]}
          </p>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <FormField
              field={{
                name: "state",
                label: "Review status",
                type: "select",
                required: true,
              }}
              values={draft[item.id]}
              onChange={handleChange}
              layout="plain"
              disabled={busy || saved}
              idPrefix={`submission-${item.id}`}
              error={fieldError(errors[item.id], "state")}
              options={stateOptions}
            />

            <FormField
              field={{
                name: "note",
                label: "Review note",
                type: "textarea",
                required: draft[item.id].state === "not_applicable",
                maxLength: 2000,
                className: "min-h-24",
              }}
              values={draft[item.id]}
              onChange={handleChange}
              layout="plain"
              disabled={busy || saved}
              idPrefix={`submission-${item.id}`}
              error={fieldError(errors[item.id], "note")}
            />
          </div>
        </section>
      );
    })}
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={16} className="shrink-0" />Saving these checks does not change Ready or Applied. Record the actual submission separately, even if some checks are incomplete.</p>
  </FormModalShell>;
}
