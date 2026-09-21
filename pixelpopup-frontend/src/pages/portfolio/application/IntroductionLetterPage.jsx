import { ArrowRight, Download, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ApplicationPageShell from "./ApplicationPageShell";
import { applicationProfile, introductionLetter } from "./applicationData";
import { getCoverLetter, getCoverLetterDownloadUrl } from "../api/portfolioApi";

export default function IntroductionLetterPage() {
  const { coverLetterSlug } = useParams();
  const configuredSlug = coverLetterSlug || import.meta.env.VITE_DEFAULT_COVER_LETTER_SLUG || "";
  const [remoteLetter, setRemoteLetter] = useState(null);
  const [status, setStatus] = useState(configuredSlug ? "loading" : "ready");

  useEffect(() => {
    if (!configuredSlug) return undefined;
    const controller = new AbortController();
    setStatus("loading");
    getCoverLetter(configuredSlug, controller.signal)
      .then((data) => {
        setRemoteLetter(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("fallback");
      });
    return () => controller.abort();
  }, [configuredSlug]);

  const letter = useMemo(() => {
    if (!remoteLetter) return introductionLetter;
    const application = remoteLetter.application;
    return {
      heading: "Cover letter",
      title: remoteLetter.subject,
      summary: `Prepared for the ${application.job_title} opportunity at ${application.company_name}.`,
      filename: `${remoteLetter.slug}.txt`,
      downloadUrl: getCoverLetterDownloadUrl(remoteLetter.slug),
      recipient: application.recipient_name || "Hiring Manager",
      paragraphs: [remoteLetter.opening, remoteLetter.body, remoteLetter.closing].filter(Boolean),
      signoff: remoteLetter.profile.signature || remoteLetter.profile.full_name,
      profile: remoteLetter.profile,
      application,
    };
  }, [remoteLetter]);

  const profile = letter.profile || applicationProfile;

  return (
    <ApplicationPageShell
      title="Introduction Letter"
      description={letter.summary}
      canonicalPath={configuredSlug ? `/portfolio/introduction-letter/${configuredSlug}` : "/portfolio/introduction-letter"}
    >
      <section className="border-b border-slate-200 px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
          <div className="max-w-4xl">
            <h1 className="portfolio-display text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              {letter.heading}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">
              {letter.title}
            </p>
          </div>
          <div className="border-t border-slate-300 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-sm leading-6 text-slate-600">{letter.summary}</p>
            <a
              href={letter.downloadUrl}
              download={letter.filename}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
            >
              Download letter <Download size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <aside className="self-start border-t border-slate-300 pt-6 lg:sticky lg:top-32" aria-label="Letter details">
            <div className="flex items-center gap-3 text-slate-950">
              <FileText size={20} className="text-[#2f5bff]" aria-hidden="true" />
              <strong className="text-sm font-semibold">{remoteLetter ? "Custom application letter" : "Default application draft"}</strong>
            </div>
            <dl className="mt-7 space-y-6 text-sm">
              <div>
                <dt className="text-slate-500">Prepared for</dt>
                <dd className="mt-1 font-semibold text-slate-900">{letter.recipient}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Primary focus</dt>
                <dd className="mt-1 leading-6 text-slate-900">{letter.application ? `${letter.application.job_title} at ${letter.application.company_name}` : "Senior frontend, full-stack, and technical leadership"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contact</dt>
                <dd className="mt-1">
                  <a className="font-semibold text-[#2448d8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                </dd>
              </div>
            </dl>
          </aside>

          <article className="rounded-2xl border border-slate-200 bg-white px-6 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
            <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-slate-950">{profile.full_name || applicationProfile.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{profile.headline || applicationProfile.role}</p>
              </div>
              <img className="size-20 rounded-full object-cover object-top" src={applicationProfile.portrait} alt="Mico Ang in a professional portrait" />
            </header>
            <div className="mt-10 max-w-3xl space-y-7 text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">
              {letter.paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>
              ))}
              <div className="pt-3">
                <p>Sincerely,</p>
                <p className="mt-3 font-semibold text-slate-950">{letter.signoff}</p>
                <p className="text-sm text-slate-500">{applicationProfile.leadershipRole}</p>
              </div>
            </div>
          </article>
        </div>
        {status === "loading" ? <p className="mx-auto mt-6 max-w-7xl text-sm text-slate-500" role="status">Loading the custom cover letter...</p> : null}
        {status === "fallback" ? <p className="mx-auto mt-6 max-w-7xl text-sm text-amber-700" role="status">The custom letter could not be loaded, so the default introduction is shown.</p> : null}
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-y border-slate-300 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-slate-950">Prefer a more personal introduction?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">The intro video page is ready for the final recording.</p>
          </div>
          <a href="/portfolio/intro-video" className="group inline-flex min-h-12 items-center gap-3 self-start rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] sm:self-auto">
            View intro video <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
