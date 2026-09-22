import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  LayoutGrid,
  LockKeyhole,
  Mail,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
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
    <dialog ref={dialogRef} className="asta-project-dialog asta-project-dialog--refined fixed inset-0 m-auto overscroll-contain" aria-labelledby="asta-project-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={handleKeyDown}>
      <div className="asta-project-dialog__shell">
        <button type="button" className="asta-project-dialog__close" onClick={onClose} aria-label="Close project inquiry"><X aria-hidden="true" /></button>
        <aside className="asta-project-dialog__intro">
          <div className="asta-project-dialog__brand">
            <img src="/portfolio/assets/asta-logo.png" alt="" />
            <span><strong>ASTA</strong><small>Softwares</small></span>
          </div>
          <div className="asta-project-dialog__intro-copy">
            <h2>Hire ASTA to build around <span>your business.</span></h2>
            <p>Share the problem, workflow, or product you want to improve. We’ll turn your answers into an email you can review before sending.</p>
            <ul aria-label="What to expect from ASTA">
              <li><Zap aria-hidden="true" /><span>Strategic thinking</span></li>
              <li><UsersRound aria-hidden="true" /><span>Technical excellence</span></li>
              <li><BarChart3 aria-hidden="true" /><span>Real business impact</span></li>
            </ul>
          </div>
          <a className="asta-project-dialog__contact" href={`mailto:${contact.email}`}>
            <Mail aria-hidden="true" />
            <span><small>Have a question?</small><strong>{contact.email}</strong></span>
          </a>
          <p className="asta-project-dialog__path"><span>Ideas</span><ArrowRight aria-hidden="true" /><span>Build</span><ArrowRight aria-hidden="true" /><span>Grow together</span></p>
        </aside>
        <form ref={formRef} className="asta-project-dialog__form" onSubmit={handleSubmit} noValidate>
          <header className="asta-project-dialog__form-heading">
            <h2 id="asta-project-dialog-title">Project inquiry</h2>
            <p>Tell us about your project and we’ll prepare an email to ASTA.</p>
          </header>
          <div className="asta-project-dialog__grid">
            <ModalField icon={UserRound} inputRef={firstFieldRef} label="Full name" name="fullName" value={values.fullName} error={errors.fullName} onChange={updateField} autoComplete="name" placeholder="Your name" />
            <ModalField icon={Mail} label="Work email" name="email" type="email" value={values.email} error={errors.email} onChange={updateField} autoComplete="email" placeholder="you@company.com" />
            <ModalField icon={Building2} label="Company (optional)" name="company" value={values.company} onChange={updateField} autoComplete="organization" placeholder="Your company name" />
            <ModalSelect icon={LayoutGrid} label="Project type" name="projectType" value={values.projectType} error={errors.projectType} onChange={updateField} options={["Custom software", "Web application", "Mobile application", "UI/UX and frontend", "Systems integration", "Automation", "Not sure yet"]} />
            <ModalSelect icon={CalendarDays} label="Preferred timeline (optional)" name="timeline" value={values.timeline} onChange={updateField} options={["As soon as possible", "Within 1–3 months", "Within 3–6 months", "More than 6 months", "Open to discuss"]} />
            <ModalSelect icon={CircleDollarSign} label="Budget range (optional)" name="budget" value={values.budget} onChange={updateField} options={["Under ₱100,000", "₱100,000–₱300,000", "₱300,000–₱750,000", "₱750,000+", "Open to discuss"]} />
          </div>
          <label className="asta-field asta-field--wide" htmlFor="asta-project-message"><span className="asta-field__label"><FileText aria-hidden="true" />What do you want to build?</span><textarea id="asta-project-message" name="message" rows="4" value={values.message} onChange={updateField} placeholder="Tell us about your goals, the problem you’re solving, key features, or anything else we should know." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "asta-project-message-error" : undefined} />{errors.message ? <small id="asta-project-message-error" className="asta-field__error">{errors.message}</small> : null}</label>
          <label className="asta-consent"><input name="consent" type="checkbox" checked={values.consent} onChange={updateField} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "asta-project-consent-error" : undefined} /><span>I agree that ASTA may contact me about this project inquiry.</span></label>
          {errors.consent ? <small id="asta-project-consent-error" className="asta-field__error">{errors.consent}</small> : null}
          <div className="asta-project-dialog__actions">
            <button type="submit" disabled={status === "preparing"}>{status === "preparing" ? "Preparing email…" : "Prepare project email"}<ArrowRight aria-hidden="true" /></button>
            <p role="status" aria-live="polite"><LockKeyhole aria-hidden="true" /><span>{status === "invalid" ? "Review the highlighted fields and try again." : status === "ready" ? "Your email draft is ready. Send it from your email app when you are satisfied." : `The form prepares an email to ${contact.email}.`}</span></p>
          </div>
        </form>
      </div>
      <style>{`
        .asta-project-dialog--refined {
          width: min(calc(100% - 40px), 1240px);
          height: min(760px, calc(100dvh - 40px));
          border: 0;
          background: #ffffff;
          box-shadow: 0 34px 90px -30px rgba(1, 10, 22, 0.7);
        }

        .asta-project-dialog--refined::backdrop {
          background: rgba(3, 14, 31, 0.78);
          backdrop-filter: none;
        }

        .asta-project-dialog--refined .asta-project-dialog__shell {
          grid-template-columns: minmax(330px, 0.78fr) minmax(0, 1.42fr);
        }

        .asta-project-dialog--refined .asta-project-dialog__intro {
          position: relative;
          justify-content: flex-start;
          overflow: hidden;
          background-color: #061a38;
          background-image: radial-gradient(circle, rgba(126, 181, 255, 0.2) 1px, transparent 1.5px);
          background-position: 14px 14px;
          background-size: 28px 28px;
          padding: 38px 42px 32px;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro::after {
          position: absolute;
          width: 360px;
          height: 360px;
          border: 1px solid rgba(83, 155, 255, 0.25);
          border-radius: 50%;
          content: "";
          right: -230px;
          top: -210px;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro > * {
          position: relative;
          z-index: 1;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro > div {
          margin-top: 0;
          padding-top: 0;
          border-top: 0;
        }

        .asta-project-dialog__brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .asta-project-dialog__brand img {
          width: 44px;
          height: 44px;
          object-fit: cover;
        }

        .asta-project-dialog__brand > span {
          display: grid;
          gap: 1px;
        }

        .asta-project-dialog__brand strong {
          color: #ffffff;
          font-family: "Saira Condensed", sans-serif;
          font-size: 18px;
          letter-spacing: 0.18em;
          line-height: 1;
        }

        .asta-project-dialog__brand small {
          color: #a9c7ea;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro-copy {
          display: block;
          margin-block: auto;
          padding-block: 46px 34px;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro-copy h2 {
          margin: 0;
          max-width: 10ch;
          font-size: clamp(42px, 4vw, 58px);
          letter-spacing: -0.03em;
          line-height: 0.98;
        }

        .asta-project-dialog__intro-copy h2 span {
          display: block;
          color: #65a9ff;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro-copy > p {
          max-width: 35ch;
          margin-top: 26px;
          color: #c1d3e8;
          font-size: 14px;
          line-height: 1.7;
        }

        .asta-project-dialog__intro-copy ul {
          display: grid;
          gap: 12px;
          margin: 28px 0 0;
          padding: 24px 0 0;
          border-top: 1px solid rgba(179, 209, 244, 0.2);
          list-style: none;
        }

        .asta-project-dialog__intro-copy li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d8e7f7;
          font-size: 12px;
        }

        .asta-project-dialog--refined .asta-project-dialog__intro-copy li svg {
          width: 17px;
          height: 17px;
          color: #65a9ff;
        }

        .asta-project-dialog--refined .asta-project-dialog__contact {
          display: flex;
          align-items: center;
          gap: 13px;
          background: rgba(11, 43, 82, 0.9);
          color: #ffffff !important;
          padding: 15px 17px;
          text-decoration: none;
          transition: background-color 180ms ease-out;
        }

        .asta-project-dialog--refined .asta-project-dialog__contact:hover {
          background: #103b70;
        }

        .asta-project-dialog--refined .asta-project-dialog__contact svg {
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
          color: #65a9ff;
        }

        .asta-project-dialog__contact span {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .asta-project-dialog__contact small {
          color: #8fb6df;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .asta-project-dialog__contact strong {
          overflow-wrap: anywhere;
          font-size: 12px;
          font-weight: 600;
        }

        .asta-project-dialog--refined .asta-project-dialog__path {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 24px 0 0;
          color: #7fa5ce;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .asta-project-dialog__path svg {
          width: 12px;
          height: 12px;
        }

        .asta-project-dialog--refined .asta-project-dialog__form {
          padding: 44px 48px 36px;
          scrollbar-color: #9fb2c7 #eef3f7;
        }

        .asta-project-dialog__form-heading {
          margin-bottom: 30px;
          padding-right: 52px;
        }

        .asta-project-dialog__form-heading h2 {
          margin: 0;
          color: var(--asta-ink);
          font-size: clamp(36px, 3.5vw, 48px);
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .asta-project-dialog__form-heading p {
          margin-top: 9px;
          color: #60758b;
          font-size: 14px;
          line-height: 1.55;
        }

        .asta-project-dialog--refined .asta-project-dialog__close {
          top: 22px;
          right: 22px;
          width: 44px;
          height: 44px;
          border: 0;
          background: #edf3f9;
        }

        .asta-project-dialog--refined .asta-project-dialog__close:hover {
          background: var(--asta-navy);
        }

        .asta-project-dialog--refined .asta-project-dialog__grid {
          gap: 18px 20px;
        }

        .asta-project-dialog--refined .asta-field {
          gap: 7px;
        }

        .asta-project-dialog--refined .asta-field__label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #203851;
          font-size: 12px;
          font-weight: 700;
        }

        .asta-project-dialog--refined .asta-field__label svg {
          width: 15px;
          height: 15px;
          color: #315c8e;
        }

        .asta-project-dialog--refined .asta-field input,
        .asta-project-dialog--refined .asta-field select,
        .asta-project-dialog--refined .asta-field textarea {
          min-height: 48px;
          border-color: #c8d5e2;
          background: #fbfcfe;
        }

        .asta-project-dialog--refined .asta-field input::placeholder,
        .asta-project-dialog--refined .asta-field textarea::placeholder {
          color: #7c8fa3;
          opacity: 1;
        }

        .asta-project-dialog--refined .asta-field textarea {
          min-height: 118px;
          line-height: 1.55;
        }

        .asta-project-dialog--refined .asta-consent {
          align-items: center;
          margin-top: 18px;
          color: #425b74;
        }

        .asta-project-dialog--refined .asta-project-dialog__actions {
          grid-template-columns: minmax(220px, 0.92fr) minmax(0, 1.08fr);
          margin-top: 22px;
          padding-top: 22px;
        }

        .asta-project-dialog--refined .asta-project-dialog__actions button {
          min-height: 52px;
          font-size: 14px;
        }

        .asta-project-dialog--refined .asta-project-dialog__actions p {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #60758b;
        }

        .asta-project-dialog__actions p svg {
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
          color: #315c8e;
        }

        @media (max-width: 1100px) {
          .asta-project-dialog--refined {
            overflow-y: auto;
          }

          .asta-project-dialog--refined .asta-project-dialog__shell {
            grid-template-columns: 1fr;
          }

          .asta-project-dialog--refined .asta-project-dialog__intro {
            min-height: auto;
            padding: 32px;
          }

          .asta-project-dialog--refined .asta-project-dialog__intro-copy {
            padding-block: 42px 28px;
          }

          .asta-project-dialog--refined .asta-project-dialog__intro-copy h2 {
            max-width: 13ch;
          }

          .asta-project-dialog--refined .asta-project-dialog__form {
            overflow: visible;
            padding: 42px 32px 36px;
          }
        }

        @media (max-width: 560px) {
          .asta-project-dialog--refined {
            width: calc(100% - 20px);
            height: calc(100dvh - 20px);
          }

          .asta-project-dialog--refined .asta-project-dialog__intro {
            padding: 28px 20px;
          }

          .asta-project-dialog--refined .asta-project-dialog__intro-copy h2 {
            font-size: 40px;
          }

          .asta-project-dialog--refined .asta-project-dialog__path {
            flex-wrap: wrap;
          }

          .asta-project-dialog--refined .asta-project-dialog__form {
            padding: 68px 20px 28px;
          }

          .asta-project-dialog--refined .asta-project-dialog__grid,
          .asta-project-dialog--refined .asta-project-dialog__actions {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .asta-project-dialog--refined[open] {
            animation: none;
          }
        }
      `}</style>
    </dialog>
  );
}

function ModalField({ icon: Icon, label, name, error, type = "text", inputRef, ...props }) {
  const id = `asta-project-${name}`;
  return <label className="asta-field" htmlFor={id}><span className="asta-field__label">{Icon ? <Icon aria-hidden="true" /> : null}{label}</span><input ref={inputRef} id={id} name={name} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}

function ModalSelect({ icon: Icon, label, name, options, error, ...props }) {
  const id = `asta-project-${name}`;
  return <label className="asta-field" htmlFor={id}><span className="asta-field__label">{Icon ? <Icon aria-hidden="true" /> : null}{label}</span><select id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}><option value="">Choose an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error ? <small id={`${id}-error`} className="asta-field__error">{error}</small> : null}</label>;
}
