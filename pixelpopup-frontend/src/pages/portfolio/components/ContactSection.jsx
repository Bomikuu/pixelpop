import { createElement, useRef, useState } from "react";
import {
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  Github,
  Info,
  Lightbulb,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  TriangleAlert,
  Waypoints,
} from "lucide-react";
import { portfolioLinks } from "../portfolioData";
import Reveal from "./Reveal";
import TurnstileWidget from "./TurnstileWidget";
import { newSubmissionId, submitInquiry } from "../../../lib/inquiries";

const iconMap = { LinkedIn: Linkedin, GitHub: Github, Email: Mail };

const contactPrinciples = [
  {
    title: "Direct conversation",
    detail: "Your inquiry reaches my inbox.",
    icon: MessageCircle,
  },
  {
    title: "Practical feedback",
    detail: "We can focus on product and technical tradeoffs.",
    icon: Lightbulb,
  },
  {
    title: "A useful next step",
    detail: "The reply starts with the next useful question.",
    icon: Waypoints,
  },
];

const defaultProjectTypeOptions = [
  "Product frontend",
  "Full-stack web app",
  "Frontend architecture review",
  "SEO and performance",
  "Technical leadership",
  "Something else",
];

const fieldClassName =
  "mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2f5bff] focus:bg-white focus:ring-4 focus:ring-blue-100";

const alertStyles = {
  success: { icon: CircleCheck, className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  warning: { icon: TriangleAlert, className: "border-amber-200 bg-amber-50 text-amber-950" },
  error: { icon: CircleAlert, className: "border-rose-200 bg-rose-50 text-rose-900" },
  pending: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-950" },
};

export default function ContactSection({
  id = "contact",
  heading = "Let’s build something useful.",
  compactHeading = false,
  description = "Tell me what you’re building, where the interface is getting difficult, and what success should look like. Your inquiry is sent directly to my inbox.",
  formTitle = "Start a conversation",
  formSubtitle = "I usually reply with the next useful question.",
  projectTypeLabel = "What are we building?",
  projectTypeOptions = defaultProjectTypeOptions,
  defaultProjectType = "Product frontend",
  messageLabel = "Project details",
  messagePlaceholder = "What needs to ship, improve, or become easier to use?",
}) {
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [deliveryDelayed, setDeliveryDelayed] = useState(false);
  const submissionIdRef = useRef(null);
  const showStatus = (message, variant = "error") => setStatus({ message, variant });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || deliveryDelayed) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const honeypot = String(data.get("companyWebsite") || "").trim();

    if (honeypot) {
      showStatus("Thanks — your message was sent.", "success");
      return;
    }

    const name = String(data.get("name") || "").trim().slice(0, 100);
    const email = String(data.get("email") || "").trim().slice(0, 254);
    const projectType = String(data.get("projectType") || "").slice(0, 80);
    const message = String(data.get("message") || "").trim().slice(0, 2000);

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !projectType || message.length < 10) {
      showStatus("Complete your name, email, project type, and at least 10 characters of project details.");
      form.querySelector(!name ? '[name="name"]' : !/^\S+@\S+\.\S+$/.test(email) ? '[name="email"]' : !projectType ? '[name="projectType"]' : '[name="message"]')?.focus();
      return;
    }

    if (!turnstileToken) {
      showStatus("Please complete the bot verification before sending.");
      return;
    }

    setIsSubmitting(true);
    showStatus("Sending your inquiry...", "pending");

    try {
      submissionIdRef.current ||= newSubmissionId();
      const result = await submitInquiry({
        kind: "portfolio_contact", submissionId: submissionIdRef.current,
        name, email, projectType, message, companyWebsite: honeypot, turnstileToken,
      });

      if (result.deliveryStatus !== "sent") {
        setDeliveryDelayed(true);
        showStatus("Your inquiry was saved, but the email notification is delayed. You do not need to send it again.", "warning");
        setTurnstileToken("");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      form.reset();
      submissionIdRef.current = null;
      setMessageLength(0);
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
      showStatus("Your inquiry was sent. Thanks for reaching out.", "success");
    } catch (error) {
      if (error.code === "BOT_VERIFICATION_FAILED") {
        showStatus("Bot verification expired. Please complete it again.");
      } else if (error.status === 429) {
        showStatus("Too many attempts. Please wait a few minutes and try again.");
      } else if (error.status === 503) {
        showStatus("The contact form is unavailable right now. Please email me directly.");
      } else if (error.code === "VALIDATION_ERROR") {
        showStatus("Review your details and try again.");
      } else {
        showStatus("Unable to confirm your inquiry. Please verify again and retry, or email me directly.");
      }
      setTurnstileToken("");
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertStyle = status ? alertStyles[status.variant] : null;
  const StatusIcon = alertStyle?.icon;

  return (
    <section id={id} className="relative isolate scroll-mt-24 overflow-hidden bg-[#071a33] py-24 text-white sm:py-32">
      <div
        className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rotate-45 border border-blue-300/10 bg-blue-500/[0.025]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 top-24 h-96 w-96 rotate-12 bg-blue-500/[0.07]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[4%] top-10 size-36 bg-[radial-gradient(circle,rgba(96,165,250,0.42)_1px,transparent_1.5px)] bg-[size:18px_18px] opacity-50"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 right-[4%] size-36 bg-[radial-gradient(circle,rgba(96,165,250,0.38)_1px,transparent_1.5px)] bg-[size:18px_18px] opacity-45"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 xl:gap-28">
          <Reveal>
            <div className="lg:pt-8">
              <h2 className={`portfolio-display max-w-2xl font-semibold leading-[1.02] tracking-[-0.04em] text-balance ${compactHeading ? "text-4xl sm:text-5xl lg:text-6xl" : "text-5xl sm:text-6xl lg:text-7xl"}`}>
                {heading}
              </h2>
              <p className="mt-7 max-w-xl text-lg leading-8 text-blue-100/80">{description}</p>

              <div className="mt-10 grid gap-7 border-y border-white/15 py-8 sm:grid-cols-3 lg:gap-5">
                {contactPrinciples.map(({ title, detail, icon }) => (
                  <div key={title}>
                    <span className="grid size-11 place-items-center rounded-xl border border-blue-300/20 bg-blue-300/10 text-blue-300">
                      {createElement(icon, { size: 20, strokeWidth: 1.8, "aria-hidden": true })}
                    </span>
                    <strong className="mt-4 block text-sm font-semibold text-white">{title}</strong>
                    <span className="mt-1.5 block text-sm leading-6 text-blue-100/65">{detail}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <span className="block text-sm font-medium text-blue-100/60">Connect with me</span>
                <div className="mt-3 flex flex-wrap gap-3">
                  {portfolioLinks.map((link) => {
                    const Icon = iconMap[link.label];
                    const isExternal = link.href.startsWith("http");

                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-300 hover:bg-blue-300/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
                      >
                        <Icon size={16} aria-hidden="true" />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <form
              onSubmit={handleSubmit}
              onChange={() => { if (!deliveryDelayed) submissionIdRef.current = null; }}
              noValidate
              aria-busy={isSubmitting}
              className="rounded-3xl bg-white p-6 text-slate-950 shadow-[0_32px_90px_-52px_rgba(0,0,0,0.78)] sm:p-8 lg:p-10"
            >
              <label className="sr-only" aria-hidden="true">
                Company website
                <input
                  name="companyWebsite"
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  data-lpignore="true"
                />
              </label>

              <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-6">
                <div>
                  <h3 className="portfolio-display text-xl font-semibold tracking-[-0.025em] text-slate-950">
                    {formTitle}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{formSubtitle}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50 text-[#2f5bff]">
                  <Send size={19} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Name
                  <input
                    name="name"
                    required
                    maxLength="100"
                    autoComplete="name"
                    className={fieldClassName}
                    placeholder="Your name"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength="254"
                    autoComplete="email"
                    className={fieldClassName}
                    placeholder="you@company.com"
                  />
                </label>
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                {projectTypeLabel}
                <select
                  name="projectType"
                  defaultValue={defaultProjectType}
                  className={fieldClassName}
                >
                  {projectTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                <span className="flex items-center justify-between gap-4">
                  <span>{messageLabel}</span>
                  <span className="text-xs font-medium tabular-nums text-slate-400">{messageLength}/2000</span>
                </span>
                <textarea
                  name="message"
                  required
                  maxLength="2000"
                  rows="6"
                  onChange={(event) => setMessageLength(event.target.value.length)}
                  className={`${fieldClassName} resize-y`}
                  placeholder={messagePlaceholder}
                />
              </label>

              <div className="mt-5 rounded-xl bg-blue-50 px-4 pb-4 pt-px text-blue-950 [&>p]:mt-4 [&>p]:text-sm [&>p]:text-amber-800 [&>div]:mt-4">
                <TurnstileWidget key={turnstileResetKey} onTokenChange={setTurnstileToken} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || deliveryDelayed}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2f5bff] px-5 py-3.5 font-semibold text-white transition hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] disabled:cursor-wait disabled:opacity-65"
              >
                {isSubmitting ? "Sending..." : deliveryDelayed ? "Inquiry received" : "Send inquiry"}
                <ArrowUpRight size={18} aria-hidden="true" />
              </button>
              <div className="mt-3 min-h-6" role={status?.variant === "error" || status?.variant === "warning" ? "alert" : "status"}>
                {status && (
                  <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6 ${alertStyle.className}`}>
                    <StatusIcon className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    <p>{status.message}</p>
                  </div>
                )}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
