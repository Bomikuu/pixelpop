import { useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Mail } from "lucide-react";
import AstaReveal from "../AstaReveal";
import { contact } from "../astaData";

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  interest: "",
  workPreference: "",
  profileUrl: "",
  message: "",
  consent: false,
};

function validateApplication(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.interest) errors.interest = "Choose an area of interest.";
  if (!values.workPreference) errors.workPreference = "Choose a work preference.";
  if (values.profileUrl) {
    try {
      const profileUrl = new URL(values.profileUrl);
      if (!/^https?:$/.test(profileUrl.protocol) || !profileUrl.hostname) throw new Error("Invalid profile URL");
    } catch {
      errors.profileUrl = "Enter a complete URL with a valid website address.";
    }
  }
  if (!values.message.trim()) errors.message = "Tell us briefly what you would like to work on.";
  if (!values.consent) errors.consent = "Confirm that ASTA may use these details for recruitment follow-up.";
  return errors;
}

export default function AstaCareersSection() {
  const formRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "preparing") return;
    const nextErrors = validateApplication(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("invalid");
      const firstInvalid = formRef.current?.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`);
      firstInvalid?.focus();
      return;
    }

    setStatus("preparing");
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    try {
      const subject = encodeURIComponent(`ASTA application: ${values.interest}`);
      const body = encodeURIComponent([
        `Name: ${values.fullName}`,
        `Email: ${values.email}`,
        `Phone: ${values.phone || "Not provided"}`,
        `Area of interest: ${values.interest}`,
        `Work preference: ${values.workPreference}`,
        `Profile: ${values.profileUrl || "Not provided"}`,
        "",
        values.message,
      ].join("\n"));
      setStatus("ready");
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section className="asta-home-careers" id="careers" aria-labelledby="asta-careers-title">
      <div className="asta-agency-container asta-careers-layout">
        <AstaReveal className="asta-careers-copy">
          <p className="asta-home-heading__eyebrow">Careers at ASTA</p>
          <span className="asta-careers-copy__icon"><BriefcaseBusiness aria-hidden="true" /></span>
          <h2 id="asta-careers-title">Build meaningful software with us.</h2>
          <p>We want to meet people who enjoy solving real business problems, collaborating closely, and building software others can rely on.</p>
          <div className="asta-careers-copy__note"><Mail aria-hidden="true" /><span>Applications are currently handled through email. Your form values stay in the browser until your email app opens.</span></div>
        </AstaReveal>
        <AstaReveal className="asta-careers-form-wrap" delay={90}>
          <form ref={formRef} className="asta-careers-form" onSubmit={handleSubmit} noValidate>
            <div className="asta-careers-form__grid">
              <Field label="Full name" name="fullName" value={values.fullName} error={errors.fullName} onChange={updateField} autoComplete="name" />
              <Field label="Email address" name="email" type="email" value={values.email} error={errors.email} onChange={updateField} autoComplete="email" />
              <Field label="Phone number (optional)" name="phone" type="tel" value={values.phone} onChange={updateField} autoComplete="tel" />
              <SelectField label="Area of interest" name="interest" value={values.interest} error={errors.interest} onChange={updateField} options={["Frontend Engineering", "Backend Engineering", "Full-stack Engineering", "UI/UX Design", "Quality Assurance", "Project or Product Operations", "General application"]} />
              <SelectField label="Work preference" name="workPreference" value={values.workPreference} error={errors.workPreference} onChange={updateField} options={["Full-time", "Part-time", "Contract", "Internship", "Open to discuss"]} />
              <Field label="Portfolio, LinkedIn, or GitHub URL (optional)" name="profileUrl" type="url" value={values.profileUrl} error={errors.profileUrl} onChange={updateField} placeholder="https://" />
            </div>
            <label className="asta-field asta-field--wide" htmlFor="asta-application-message"><span>Short message</span><textarea id="asta-application-message" name="message" rows="4" value={values.message} onChange={updateField} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message ? <small id="message-error" className="asta-field__error">{errors.message}</small> : null}</label>
            <label className="asta-consent"><input name="consent" type="checkbox" checked={values.consent} onChange={updateField} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "asta-application-consent-error" : undefined} /><span>I agree to share these details with ASTA for recruitment follow-up.</span></label>
            {errors.consent ? <small id="asta-application-consent-error" className="asta-field__error">{errors.consent}</small> : null}
            <div className="asta-careers-form__actions">
              <button type="submit" disabled={status === "preparing"}>{status === "preparing" ? "Preparing email…" : "Apply Now"}<ArrowRight aria-hidden="true" /></button>
              <p role="status" aria-live="polite">{status === "invalid" ? "Review the highlighted fields and try again." : status === "ready" ? "Your application email is ready. If no email app opened, use the address shown beside the form." : status === "failed" ? `We could not open your email app. Email ${contact.email} directly.` : "No recruitment API is connected; this form prepares an email application."}</p>
            </div>
          </form>
        </AstaReveal>
      </div>
    </section>
  );
}

function Field({ label, name, error, type = "text", ...props }) {
  const id = `asta-application-${name}`;
  return <label className="asta-field" htmlFor={id}><span>{label}</span><input id={id} name={name} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}

function SelectField({ label, name, options, error, ...props }) {
  const id = `asta-application-${name}`;
  return <label className="asta-field" htmlFor={id}><span>{label}</span><select id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}><option value="">Choose an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}
