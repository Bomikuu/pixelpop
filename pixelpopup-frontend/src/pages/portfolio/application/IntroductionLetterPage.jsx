import { ArrowRight, Download, FileText, Mail, Target, UsersRound } from "lucide-react";
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
      publishedAt: remoteLetter.published_at,
      profile: remoteLetter.profile,
      application,
    };
  }, [remoteLetter]);

  const profile = letter.profile || applicationProfile;
  const publishedDate = letter.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(letter.publishedAt))
    : null;
  const documentMeta = [publishedDate, profile.location || "Remote"]
    .filter(Boolean)
    .join(" · ");

  return (
    <ApplicationPageShell
      title="Introduction Letter"
      description={letter.summary}
      canonicalPath={configuredSlug ? `/portfolio/introduction-letter/${configuredSlug}` : "/portfolio/introduction-letter"}
    >
      <section className="relative overflow-hidden border-b border-[#dbe7f3] bg-white px-5 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
        <div className="pointer-events-none absolute -left-28 bottom-[-9rem] size-80 rotate-45 bg-[#f2f7ff]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 top-20 size-64 rotate-45 bg-[#f6f9fd]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f5bff]">
              <span>Application material</span>
              <span className="h-px w-28 bg-[#c9d8ed]" aria-hidden="true" />
            </div>
            <h1 className="portfolio-display text-balance text-5xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-7xl">
              {letter.heading}
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-[#536b86] sm:text-2xl sm:leading-9">
              {letter.title}
            </p>
          </div>
          <div className="border-t border-[#ccdaea] pt-6 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center bg-[#edf4ff] text-[#2f5bff]">
                <FileText size={22} aria-hidden="true" />
              </span>
              <p className="text-sm leading-6 text-[#536b86]">{letter.summary}</p>
            </div>
            <a
              href={letter.downloadUrl}
              download={letter.filename}
              className="group mt-6 inline-flex min-h-[52px] w-full items-center justify-between gap-3 bg-[#2f5bff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(47,91,255,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
            >
              Download letter <Download size={18} className="transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8fbff] px-5 py-14 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute left-10 top-14 grid grid-cols-5 gap-3 opacity-40" aria-hidden="true">
          {Array.from({ length: 15 }).map((_, index) => <span key={index} className="size-1 bg-[#8eb8ff]" />)}
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          <aside className="self-start rounded-2xl bg-white p-7 ring-1 ring-[#d8e4f0] lg:sticky lg:top-28" aria-label="Letter details">
            <div className="flex items-center gap-4 border-b border-[#dbe6f0] pb-6 text-slate-950">
              <span className="grid size-12 shrink-0 place-items-center bg-[#edf4ff] text-[#2f5bff]">
                <FileText size={22} aria-hidden="true" />
              </span>
              <div>
                <strong className="block text-sm font-semibold">{remoteLetter ? "Custom application letter" : "Default application draft"}</strong>
                <p className="mt-1 text-xs leading-5 text-[#647990]">{remoteLetter ? "Prepared for this opportunity." : "A general version for new opportunities."}</p>
              </div>
            </div>
            <dl className="divide-y divide-[#e0e9f2] text-sm">
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 py-6">
                <span className="grid size-10 place-items-center bg-[#f1f6fd] text-[#2f5bff]" aria-hidden="true"><UsersRound size={19} /></span>
                <div>
                  <dt className="text-[#647990]">Prepared for</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{letter.recipient}</dd>
                  <dd className="mt-1 text-xs leading-5 text-[#718399]">{letter.application ? letter.application.company_name : "General application"}</dd>
                </div>
              </div>
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 py-6">
                <span className="grid size-10 place-items-center bg-[#f1f6fd] text-[#2f5bff]" aria-hidden="true"><Target size={19} /></span>
                <div>
                  <dt className="text-[#647990]">Primary focus</dt>
                  <dd className="mt-1 font-semibold leading-6 text-slate-950">{letter.application ? `${letter.application.job_title} at ${letter.application.company_name}` : "Senior frontend, full-stack, and technical leadership"}</dd>
                  <dd className="mt-1 text-xs leading-5 text-[#718399]">Product, architecture, and team leadership</dd>
                </div>
              </div>
              <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 py-6">
                <span className="grid size-10 place-items-center bg-[#f1f6fd] text-[#2f5bff]" aria-hidden="true"><Mail size={19} /></span>
                <div>
                  <dt className="text-[#647990]">Contact</dt>
                  <dd className="mt-1 break-words">
                    <a className="font-semibold text-[#2448d8] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" href={`mailto:${profile.email}`}>
                      {profile.email}
                    </a>
                  </dd>
                  <dd className="mt-1 text-xs leading-5 text-[#718399]">Feel free to reach out.</dd>
                </div>
              </div>
            </dl>
          </aside>

          <article aria-labelledby="letter-author" className="rounded-2xl bg-white px-6 py-8 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)] ring-1 ring-[#d8e4f0] sm:px-10 sm:py-10 lg:px-14 lg:py-12 xl:px-16">
            <div className="flex flex-col gap-3 border-b border-[#dbe6f0] pb-5 text-xs font-semibold tracking-[0.12em] text-[#687d94] uppercase sm:flex-row sm:items-center sm:justify-between">
              <span>Cover letter</span>
              <span className="tracking-normal normal-case">{documentMeta}</span>
            </div>
            <header className="flex flex-col gap-6 border-b border-[#dbe6f0] py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="letter-author" className="portfolio-display text-3xl font-semibold tracking-[-0.025em] text-slate-950">{profile.full_name || applicationProfile.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#647990]">{profile.headline || applicationProfile.role}</p>
              </div>
              <img className="size-24 rounded-full bg-[#eef3f8] object-cover object-top ring-8 ring-[#f4f7fa]" src={applicationProfile.portrait} alt="Mico Ang in a professional portrait" />
            </header>
            <div className="mt-9 max-w-[70ch] space-y-6 text-base leading-8 text-[#334a63] sm:text-[1.05rem] sm:leading-8">
              {letter.paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>
              ))}
              <div className="pt-4">
                <p>Sincerely,</p>
                <p className="mt-3 font-semibold text-slate-950">{letter.signoff}</p>
                <p className="mt-1 text-sm text-[#647990]">{applicationProfile.leadershipRole}</p>
              </div>
            </div>
          </article>
        </div>
        {status === "loading" ? <p className="mx-auto mt-6 max-w-7xl text-sm text-slate-500" role="status">Loading the custom cover letter...</p> : null}
        {status === "fallback" ? <p className="mx-auto mt-6 max-w-7xl text-sm text-amber-700" role="status">The custom letter could not be loaded, so the default introduction is shown.</p> : null}
      </section>

      <section className="bg-[#f8fbff] px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-y border-[#ccdaea] py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="portfolio-display text-2xl font-semibold tracking-[-0.025em] text-slate-950">Prefer a more personal introduction?</h2>
            <p className="mt-2 text-sm leading-6 text-[#536b86]">The intro video page is ready for the final recording.</p>
          </div>
          <a href="/portfolio/intro-video" className="group inline-flex min-h-12 items-center gap-3 self-start border border-[#bfd0e2] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] sm:self-auto">
            View intro video <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </section>
    </ApplicationPageShell>
  );
}
