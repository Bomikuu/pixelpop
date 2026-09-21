import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, X } from "lucide-react";
import { contact } from "../astaData";

const initialValues = {
  fullName: "",
  email: "",
  company: "",
  projectType: "",
  timeline: "",
  budget: "",
  message: "",
  consent: false,
};

function validate(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.projectType) errors.projectType = "Choose the kind of project you need.";
  if (!values.message.trim()) errors.message = "Tell us what you want to build or improve.";
  if (!values.consent) errors.consent = "Confirm that ASTA may contact you about this inquiry.";
  return errors;
}

export default function AstaProjectInquiryModal({ onClose }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const firstFieldRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();
    firstFieldRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "preparing") return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("invalid");
      formRef.current?.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }

    setStatus("preparing");
    await new Promise((resolve) => window.setTimeout(resolve, 220));
    const subject = encodeURIComponent(`Project inquiry: ${values.projectType}`);
    const body = encodeURIComponent([
      `Name: ${values.fullName}`,
      `Email: ${values.email}`,
      `Company: ${values.company || "Not provided"}`,
      `Project type: ${values.projectType}`,
      `Timeline: ${values.timeline || "Open to discuss"}`,
      `Budget: ${values.budget || "Open to discuss"}`,
      "",
      values.message,
    ].join("\n"));
    setStatus("ready");
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  }

  return (
    <dialog ref={dialogRef} className="asta-project-dialog fixed inset-0 m-auto overscroll-contain" aria-labelledby="asta-project-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={handleKeyDown}>
      <div className="asta-project-dialog__shell">
        <button type="button" className="asta-project-dialog__close" onClick={onClose} aria-label="Close project inquiry"><X aria-hidden="true" /></button>
        <aside className="asta-project-dialog__intro">
          <span>Start a project</span>
          <h2 id="asta-project-dialog-title">Hire ASTA to build around your business.</h2>
          <p>Share the problem, workflow, or product you want to improve. We’ll turn your answers into an email you can review before sending.</p>
          <div><Mail aria-hidden="true" /><a href={`mailto:${contact.email}`}>{contact.email}</a></div>
        </aside>
        <form ref={formRef} className="asta-project-dialog__form" onSubmit={handleSubmit} noValidate>
          <div className="asta-project-dialog__grid">
            <ModalField inputRef={firstFieldRef} label="Full name" name="fullName" value={values.fullName} error={errors.fullName} onChange={updateField} autoComplete="name" />
            <ModalField label="Work email" name="email" type="email" value={values.email} error={errors.email} onChange={updateField} autoComplete="email" />
            <ModalField label="Company (optional)" name="company" value={values.company} onChange={updateField} autoComplete="organization" />
            <ModalSelect label="Project type" name="projectType" value={values.projectType} error={errors.projectType} onChange={updateField} options={["Custom software", "Web application", "Mobile application", "UI/UX and frontend", "Systems integration", "Automation", "Not sure yet"]} />
            <ModalSelect label="Preferred timeline (optional)" name="timeline" value={values.timeline} onChange={updateField} options={["As soon as possible", "Within 1–3 months", "Within 3–6 months", "More than 6 months", "Open to discuss"]} />
            <ModalSelect label="Budget range (optional)" name="budget" value={values.budget} onChange={updateField} options={["Under ₱100,000", "₱100,000–₱300,000", "₱300,000–₱750,000", "₱750,000+", "Open to discuss"]} />
          </div>
          <label className="asta-field asta-field--wide" htmlFor="asta-project-message"><span>What do you want to build?</span><textarea id="asta-project-message" name="message" rows="4" value={values.message} onChange={updateField} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "asta-project-message-error" : undefined} />{errors.message ? <small id="asta-project-message-error" className="asta-field__error">{errors.message}</small> : null}</label>
          <label className="asta-consent"><input name="consent" type="checkbox" checked={values.consent} onChange={updateField} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "asta-project-consent-error" : undefined} /><span>I agree that ASTA may contact me about this project inquiry.</span></label>
          {errors.consent ? <small id="asta-project-consent-error" className="asta-field__error">{errors.consent}</small> : null}
          <div className="asta-project-dialog__actions">
            <button type="submit" disabled={status === "preparing"}>{status === "preparing" ? "Preparing email…" : "Prepare project email"}<ArrowRight aria-hidden="true" /></button>
            <p role="status" aria-live="polite">{status === "invalid" ? "Review the highlighted fields and try again." : status === "ready" ? "Your email draft is ready. Send it from your email app when you are satisfied." : `The form prepares an email to ${contact.email}.`}</p>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function ModalField({ label, name, error, type = "text", inputRef, ...props }) {
  const id = `asta-project-${name}`;
  return <label className="asta-field" htmlFor={id}><span>{label}</span><input ref={inputRef} id={id} name={name} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}

function ModalSelect({ label, name, options, error, ...props }) {
  const id = `asta-project-${name}`;
  return <label className="asta-field" htmlFor={id}><span>{label}</span><select id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}><option value="">Choose an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}
