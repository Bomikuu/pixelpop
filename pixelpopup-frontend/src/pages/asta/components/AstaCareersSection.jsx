import { useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Mail } from "lucide-react";
import AstaReveal from "../AstaReveal";
import { contact } from "../astaData";
import TurnstileWidget from "../../portfolio/components/TurnstileWidget";
import { newSubmissionId, submitInquiry } from "../../../lib/inquiries";

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

const statusMessages = {
  idle: "Your application will be sent securely to ASTA.",
  invalid: "Review the highlighted fields and try again.",
  "verification-required": "Complete the bot verification before applying.",
  "verification-failed": "Verification expired. Complete it again and retry.",
  "rate-limited": "Too many attempts. Wait a few minutes and retry.",
  sending: "Sending your application…",
  failed: "We could not confirm delivery. Verify again and retry.",
  delayed: "Your application was saved, but email notification is delayed. You do not need to apply again.",
  sent: "Your application was sent. We’ll be in touch.",
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
  const submissionIdRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    submissionIdRef.current = null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (["sending", "sent", "delayed"].includes(status)) return;
    const nextErrors = validateApplication(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("invalid");
      const firstInvalid = formRef.current?.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`);
      firstInvalid?.focus();
      return;
    }

    if (!turnstileToken) {
      setStatus("verification-required");
      return;
    }

    setStatus("sending");
    try {
      submissionIdRef.current ||= newSubmissionId();
      const result = await submitInquiry({
        kind: "asta_careers", submissionId: submissionIdRef.current,
        name: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim(),
        interest: values.interest, workPreference: values.workPreference,
        profileUrl: values.profileUrl.trim(), message: values.message.trim(), consent: values.consent,
        companyWebsite: String(new FormData(formRef.current).get("companyWebsite") || "").trim(),
        turnstileToken,
      });
      if (result.deliveryStatus !== "sent") {
        setStatus("delayed");
      } else {
        setValues(initialValues);
        setStatus("sent");
      }
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } catch (error) {
      setStatus(error.code === "BOT_VERIFICATION_FAILED" ? "verification-failed" : error.status === 429 ? "rate-limited" : error.status === 503 ? "unavailable" : "failed");
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
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
          <div className="asta-careers-copy__note"><Mail aria-hidden="true" /><span>Apply through the form and we’ll send your details securely to our team.</span></div>
        </AstaReveal>
        <AstaReveal className="asta-careers-form-wrap" delay={90}>
          <form ref={formRef} className="asta-careers-form" onSubmit={handleSubmit} noValidate aria-busy={status === "sending"}>
            <label className="sr-only" aria-hidden="true">Company website<input name="companyWebsite" type="text" tabIndex="-1" autoComplete="off" /></label>
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
            <div className="mt-5 border border-[#dce4ec] bg-[#f2f6fa] px-4 pb-4 pt-px text-[#10243e] [&>p]:text-sm [&>p]:text-amber-800">
              <TurnstileWidget key={turnstileResetKey} action="asta-careers" onTokenChange={setTurnstileToken} />
            </div>
            <div className="asta-careers-form__actions">
              <button type="submit" disabled={["sending", "sent", "delayed"].includes(status)}>{status === "sending" ? "Sending application…" : status === "sent" || status === "delayed" ? "Application received" : "Apply Now"}<ArrowRight aria-hidden="true" /></button>
              <p role="status" aria-live="polite">{status === "unavailable" ? `The form is unavailable. Email ${contact.email} directly.` : statusMessages[status] || statusMessages.idle}</p>
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
