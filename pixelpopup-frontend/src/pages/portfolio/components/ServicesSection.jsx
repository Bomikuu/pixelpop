import { Link } from "react-router-dom";
import { getPortfolioServiceHref, portfolioServiceCatalog } from "../services/portfolioServices";

const serviceOrder = [
  "website-development", "website-design", "cms-solutions", "bug-fixing-responsiveness",
  "speed-optimization-seo", "website-maintenance-security", "threejs-development", "ai-automation",
];

const examples = {
  "website-development": { href: "/portfolio/dineease", label: "DineEase restaurant platform" },
  "cms-solutions": { href: "#project-cortico", label: "Cortico content management" },
  "speed-optimization-seo": { href: "/portfolio/evidence/cortico-pagespeed-mobile.png", label: "Cortico PageSpeed report" },
  "threejs-development": { href: "#top", label: "This portfolio's 3D scene" },
};

export default function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-24 border-b border-slate-200 bg-white py-24 sm:py-32" aria-labelledby="portfolio-services-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="mb-10 max-w-3xl">
          <h2 id="portfolio-services-title" className="portfolio-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">What I can help with</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Hire me for a new build, help with an existing application, or a specific issue your team needs to fix.</p>
        </header>
        <div className="border-t border-slate-200">
          {serviceOrder.map((id) => {
            const service = portfolioServiceCatalog.find((item) => item.id === id);
            if (!service) return null;
            const example = examples[id];
            return (
              <article key={id} className="grid gap-3 border-b border-slate-200 py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)_minmax(0,0.75fr)]">
                <h3 className="portfolio-display text-2xl font-semibold leading-tight tracking-[-0.025em] text-slate-950">
                  <Link to={getPortfolioServiceHref(service)} className="decoration-slate-300 underline-offset-4 hover:text-[#2149dc] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">{service.title}</Link>
                </h3>
                <p className="max-w-[65ch] text-sm leading-7 text-slate-600">{service.summary}</p>
                {example ? (
                  <p className="text-sm leading-6 md:col-start-2 lg:col-start-3">
                    <span className="block text-xs text-slate-500">See the work</span>
                    <a href={example.href} className="font-medium text-[#2149dc] underline decoration-blue-200 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">{example.label}</a>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-slate-600">
          Each service page includes scope, tools, and common questions. <Link to="/portfolio/services" className="font-semibold text-[#2149dc] underline underline-offset-4 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">Browse all services</Link>
        </p>
      </div>
    </section>
  );
}
