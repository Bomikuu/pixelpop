import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, FileText, Gauge, Layers3, Linkedin, RefreshCw } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import { applicationProfile } from "../application/applicationData";
import { getArticleCategories, getArticles } from "../api/portfolioApi";
import { portfolioLinks } from "../portfolioData";
import ArticleHeroScene from "./ArticleHeroScene";
import { formatArticleDate, getArticleAuthor } from "./articleUtils";

const categoryIcons = {
  "AI and Delivery": BrainCircuit,
  "Frontend Engineering": Layers3,
  "Performance and SEO": Gauge,
};

const defaultCategories = [
  { name: "Frontend Engineering", slug: "frontend-engineering", order: 10 },
  { name: "Performance and SEO", slug: "performance-and-seo", order: 20 },
  { name: "AI and Delivery", slug: "ai-and-delivery", order: 30 },
];

function getCategoryIcon(article) {
  return categoryIcons[article.category?.name] || BookOpen;
}

function ArticleIndexSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={`${index === 0 ? "md:col-span-2 min-h-96" : "min-h-80"} rounded-2xl bg-white p-7 ring-1 ring-slate-200 sm:p-9`}>
          <div className="size-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-8 h-4 w-40 animate-pulse bg-slate-200" />
          <div className="mt-5 h-10 w-4/5 animate-pulse bg-slate-200" />
          <div className="mt-5 h-20 animate-pulse bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ArticleEntry({ article, featured = false }) {
  const CategoryIcon = getCategoryIcon(article);
  const tone = featured
    ? {
        surface: "bg-[#0b1733] text-white",
        icon: "bg-[#2f5bff] text-white",
        category: "text-blue-300",
        meta: "text-slate-400",
        title: "text-white",
        body: "text-slate-300",
        footer: "text-slate-400",
        action: "text-white",
      }
    : {
        surface: "bg-white text-slate-950 ring-1 ring-slate-200 hover:ring-[#2f5bff]/60",
        icon: "bg-[#eff6ff] text-[#2448d8]",
        category: "text-[#2448d8]",
        meta: "text-slate-500",
        title: "text-slate-950",
        body: "text-slate-600",
        footer: "text-slate-500",
        action: "text-[#2448d8]",
      };

  return (
    <Link
      to={`/portfolio/articles/${article.slug}`}
      className={`group relative flex h-full overflow-hidden rounded-2xl p-7 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff] sm:p-9 ${tone.surface} ${featured ? "min-h-[30rem] md:col-span-2 lg:grid lg:grid-cols-[minmax(0,1.15fr)_20rem] lg:gap-12 lg:p-12" : "min-h-[23rem] flex-col"}`}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className={`grid size-12 place-items-center rounded-xl transition duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-3deg] ${tone.icon}`}>
          <CategoryIcon size={23} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className={`mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold ${tone.meta}`}>
          {article.category?.name ? <span className={tone.category}>{article.category.name}</span> : null}
          <span className="sr-only">Published </span>
          <span>{formatArticleDate(article.published_at)}</span>
          <span>{article.reading_time_minutes} min read</span>
        </div>
        <h2 className={`${featured ? "mt-5 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl" : "mt-5 text-2xl leading-tight sm:text-3xl"} portfolio-display text-balance font-semibold tracking-[-0.035em] ${tone.title}`}>
          {article.title}
        </h2>
        <p className={`${featured ? "mt-6 max-w-2xl text-lg leading-8" : "mt-5 text-base leading-7"} ${tone.body}`}>
          {article.excerpt}
        </p>
        <div className={`mt-auto flex items-end justify-between gap-4 pt-8 text-sm ${tone.footer}`}>
          <span>By {getArticleAuthor(article)}</span>
          <span className={`inline-flex items-center gap-2 font-semibold ${tone.action}`}>
            Read article
            <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1" size={17} aria-hidden="true" />
          </span>
        </div>
      </div>

      {featured ? (
        <div className="relative mt-10 hidden min-h-72 overflow-hidden rounded-xl bg-[#2f5bff] lg:block">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || ""}
              className="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <div className="grid size-full place-items-center" aria-hidden="true">
              <CategoryIcon className="text-white/90 transition duration-500 ease-out group-hover:scale-110 group-hover:rotate-[-5deg]" size={112} strokeWidth={1.15} />
            </div>
          )}
        </div>
      ) : null}
    </Link>
  );
}

export default function ArticleIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const category = searchParams.get("category") || "";
  const [categories, setCategories] = useState(defaultCategories);
  const [state, setState] = useState({ articles: [], count: 0, next: null, previous: null, loading: true, error: "" });
  const [retryKey, setRetryKey] = useState(0);
  const linkedInLink = portfolioLinks.find((link) => link.label === "LinkedIn");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getArticleCategories(controller.signal)
      .then((data) => {
        const bySlug = new Map(defaultCategories.map((item) => [item.slug, item]));
        for (const item of data) bySlug.set(item.slug, item);
        setCategories([...bySlug.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setCategories(defaultCategories);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    getArticles({ page, category }, controller.signal)
      .then((data) => {
        setState({
          articles: data.results || [],
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
          loading: false,
          error: "",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({ ...current, loading: false, error: "Articles could not be loaded right now." }));
        }
      });
    return () => controller.abort();
  }, [page, category, retryKey]);

  const selectedCategory = categories.find((item) => item.slug === category);
  const featuredArticle = state.articles.find((article) => article.is_featured) || state.articles[0];
  const remainingArticles = state.articles.filter((article) => article.slug !== featuredArticle?.slug);

  function goToPage(nextPage) {
    const nextParams = new URLSearchParams();
    if (category) nextParams.set("category", category);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
    document.getElementById("article-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ApplicationPageShell
      title="Articles"
      description="Articles by Mico Ang on frontend engineering, product systems, performance, and technical leadership."
      canonicalPath="/portfolio/articles"
    >
      <section className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden border-b border-slate-200 bg-[#fbfdff] px-5 sm:px-8">
        <ArticleHeroScene />
        <div className="pointer-events-none absolute left-[42%] top-12 hidden h-28 w-36 opacity-60 lg:block" style={{ backgroundImage: "radial-gradient(#8eb8ff 1px, transparent 1px)", backgroundSize: "23px 23px" }} aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-10 right-[4%] hidden h-28 w-36 opacity-60 lg:block" style={{ backgroundImage: "radial-gradient(#8eb8ff 1px, transparent 1px)", backgroundSize: "23px 23px" }} aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-screen-xl items-start py-24 sm:py-28 lg:w-[84%] lg:items-center lg:py-20">
          <div className="w-full max-w-[44rem] lg:max-w-[46%]">
            <p className="flex items-center gap-4 text-xs font-semibold tracking-[0.32em] text-[#2f5bff] uppercase sm:text-sm">
              Articles <span className="h-px w-14 bg-[#2f5bff]" aria-hidden="true" />
            </p>
            <h1 className="portfolio-display mt-8 text-[clamp(4rem,6vw,5.6rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-slate-950">
              Notes from<br />the build<span className="text-[#2f5bff]">.</span>
            </h1>
            <p className="mt-7 max-w-[38rem] text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">
              Practical writing on frontend systems, performance, AI, and technical leadership.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-5 sm:mt-10">
              <div className="flex items-center gap-4">
                <img className="size-16 shrink-0 rounded-full border border-slate-200 object-cover object-top" src={applicationProfile.portrait} alt="" />
                <div>
                  <strong className="text-base font-semibold text-slate-950">Mico Ang</strong>
                  <p className="mt-0.5 text-sm leading-6 text-slate-500">Author and technical lead</p>
                </div>
              </div>
              <div className="flex items-center gap-4 2xl:border-l 2xl:border-slate-200 2xl:pl-7">
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#dbe5f4] text-[#0b1733]"><FileText size={24} strokeWidth={1.7} aria-hidden="true" /></span>
                <div>
                  <strong className="text-base font-semibold text-slate-950">Latest notes</strong>
                  <p className="mt-0.5 text-sm leading-6 text-slate-500">Thoughts, lessons, and ideas</p>
                </div>
              </div>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a href="#article-list" className="inline-flex min-h-14 items-center justify-between gap-8 bg-[#2f5bff] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2149dc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Browse articles <ArrowRight size={20} aria-hidden="true" />
              </a>
              {linkedInLink ? (
                <a href={linkedInLink.href} target="_blank" rel="noopener noreferrer" aria-label="Follow Mico Ang on LinkedIn" className="inline-flex min-h-14 items-center gap-3 text-sm font-semibold text-slate-950 transition-colors hover:text-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                  <span className="grid size-14 place-items-center rounded-full border border-[#dbe5f4]"><Linkedin size={20} aria-hidden="true" /></span>
                  Follow
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="article-list" className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 max-w-2xl">
            <h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Latest articles</h2>
            {!state.loading && !state.error ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {state.count} published {state.count === 1 ? "article" : "articles"}{category ? ` in ${selectedCategory?.name || "this category"}.` : " on building clear, durable products."}
              </p>
            ) : null}
          </div>
          <nav className="mb-8 flex flex-wrap gap-x-8 gap-y-2 border-b border-slate-200 sm:mb-10" aria-label="Article categories">
            {[{ name: "All", slug: "" }, ...categories].map((item) => (
              <Link
                key={item.slug || "all"}
                to={item.slug ? `/portfolio/articles?category=${encodeURIComponent(item.slug)}` : "/portfolio/articles"}
                aria-current={category === item.slug ? "page" : undefined}
                className={`inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] ${category === item.slug ? "border-[#2f5bff] text-[#2f5bff]" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          {state.loading ? <ArticleIndexSkeleton /> : null}

          {!state.loading && state.error ? (
            <div className="border-y border-slate-300 py-12" role="alert">
              <BookOpen size={28} className="text-[#2f5bff]" aria-hidden="true" />
              <h2 className="portfolio-display mt-5 text-2xl font-semibold text-slate-950">The article library is temporarily unavailable.</h2>
              <p className="mt-3 text-slate-600">The portfolio remains available while the content service reconnects.</p>
              <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Try again <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {!state.loading && !state.error && state.articles.length === 0 ? (
            <div className="border-y border-slate-300 py-14">
              <BookOpen size={30} className="text-[#2f5bff]" aria-hidden="true" />
              <h2 className="portfolio-display mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">No articles found</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">{category ? `There are no published articles in ${selectedCategory?.name || "this category"} yet.` : "Published writing will appear here as soon as it is released from the portfolio admin."}</p>
              {category ? <Link to="/portfolio/articles" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#2f5bff] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">View all articles <ArrowRight size={16} aria-hidden="true" /></Link> : null}
            </div>
          ) : null}

          {!state.loading && !state.error && featuredArticle ? (
            <>
              <ArticleEntry article={featuredArticle} featured />
              {remainingArticles.length > 0 ? (
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {remainingArticles.map((article) => <ArticleEntry key={article.slug} article={article} />)}
                </div>
              ) : null}
            </>
          ) : null}

          {!state.loading && !state.error && (state.previous || state.next) ? (
            <nav className="mt-16 flex items-center justify-between border-t border-slate-300 pt-7" aria-label="Article pagination">
              <button type="button" disabled={!state.previous} onClick={() => goToPage(page - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:text-[#2448d8] disabled:cursor-not-allowed disabled:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">
                <ArrowLeft size={16} aria-hidden="true" /> Previous
              </button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <button type="button" disabled={!state.next} onClick={() => goToPage(page + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:text-[#2448d8] disabled:cursor-not-allowed disabled:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">
                Next <ArrowRight size={16} aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </div>
      </section>
    </ApplicationPageShell>
  );
}
