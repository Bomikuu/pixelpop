import { useState } from "react";

const reports = [
  {
    id: "search", title: "Search Console",
    src: "/portfolio/evidence/cortico-search-console.png",
    alt: "Cortico Search Console screenshot with 936K clicks and 137M impressions",
    caption: "Chart shown: March 2025 - July 2026. Totals belong to the supplied report, not a monthly figure.",
  },
  {
    id: "seo", title: "SEO overview",
    src: "/portfolio/evidence/cortico-seo-overview.png",
    alt: "Cortico SEO overview showing 170.6K organic traffic and 36.4K organic keywords",
    caption: "Supplied SEO overview. Its capture date and reporting period are not shown.",
  },
  {
    id: "mobile", title: "Mobile performance",
    src: "/portfolio/evidence/cortico-pagespeed-mobile.png",
    alt: "Cortico PageSpeed report dated August 1, 2026, showing a mobile performance score of 94",
    caption: "PageSpeed report: August 1, 2026. The lab score covers the tested page; field data is shown separately in the report.",
  },
  {
    id: "leads", title: "Lead reporting",
    src: "/portfolio/evidence/cortico-pql-dashboard.png",
    alt: "Cortico team dashboard showing 34 product-qualified leads against a July 2026 target of 35",
    caption: "July 2026: 34 product-qualified leads against a target of 35. This is a team result.",
  },
];

const metricReports = {
  "Search Console clicks": "search",
  "Search impressions": "search",
  "Organic traffic": "seo",
  "Organic keywords": "seo",
  "Mobile performance score": "mobile",
  "July PQL result": "leads",
};

export default function CorticoProof({ metrics }) {
  const [activeReportId, setActiveReportId] = useState("search");
  const activeReport = reports.find((report) => report.id === activeReportId);

  return (
    <section aria-labelledby="cortico-report-title" className="border-y border-slate-200 bg-white px-5 py-7 text-slate-950 sm:px-8 lg:px-10">
      <header className="max-w-3xl">
        <h4 id="cortico-report-title" className="portfolio-display text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Cortico reporting</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">These screenshots show the platform's search and performance reporting. They provide context for the work, not a claim that I produced every result alone.</p>
      </header>

      <dl className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const report = reports.find((item) => item.id === metricReports[metric.label]);
          const value = new Intl.NumberFormat("en-US", { maximumFractionDigits: metric.precision ?? 0 }).format(metric.value);
          return (
            <div key={metric.label}>
              <dt className="text-sm text-slate-600">{metric.label}</dt>
              <dd className="mt-1">
                <strong className="portfolio-display block text-3xl font-semibold tracking-[-0.035em] tabular-nums">{value}{metric.suffix ?? ""}</strong>
                {report ? (
                  <a href={report.src} target="_blank" rel="noreferrer" className="mt-1 inline-block py-1 text-xs font-medium text-[#2149dc] underline underline-offset-4 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                    {report.title} screenshot<span className="sr-only"> for {metric.label} (opens in a new tab)</span>
                  </a>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Choose a Cortico report">
          {reports.map((report) => (
            <button key={report.id} type="button" onClick={() => setActiveReportId(report.id)} aria-pressed={activeReportId === report.id} className={activeReportId === report.id
              ? "min-h-11 border-b-2 border-[#2f5bff] py-2 text-sm font-semibold text-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
              : "min-h-11 border-b-2 border-transparent py-2 text-sm text-slate-600 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"}>
              {report.title}
            </button>
          ))}
        </div>
        <figure className="mt-5">
          <a href={activeReport.src} target="_blank" rel="noreferrer" className="block border border-slate-200 bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]" aria-label={"Open full " + activeReport.title + " screenshot in a new tab"}>
            <img src={activeReport.src} alt={activeReport.alt} loading="lazy" decoding="async" className="h-52 w-full object-contain sm:h-80" />
          </a>
          <figcaption className="mt-3 max-w-[70ch] text-sm leading-6 text-slate-600" aria-live="polite">
            {activeReport.caption} <a href={activeReport.src} target="_blank" rel="noreferrer" className="font-medium text-[#2149dc] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">Open full screenshot<span className="sr-only"> in a new tab</span></a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
