import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Gauge, Layers3, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ApplicationPageShell from "../application/ApplicationPageShell";
import { applicationProfile } from "../application/applicationData";
import { getArticles } from "../api/portfolioApi";
import ArticleHeroScene from "./ArticleHeroScene";
import { formatArticleDate, getArticleAuthor } from "./articleUtils";

const categoryIcons = {
  "AI and Delivery": BrainCircuit,
  "Frontend Engineering": Layers3,
  "Performance and SEO": Gauge,
};

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
  const [state, setState] = useState({ articles: [], count: 0, next: null, previous: null, loading: true, error: "" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    getArticles({ page }, controller.signal)
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
  }, [page, retryKey]);

  const featuredArticle = state.articles.find((article) => article.is_featured) || state.articles[0];
  const remainingArticles = state.articles.filter((article) => article.slug !== featuredArticle?.slug);

  function goToPage(nextPage) {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
    document.getElementById("article-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ApplicationPageShell
      title="Articles"
      description="Articles by Mico Ang on frontend engineering, product systems, performance, and technical leadership."
      canonicalPath="/portfolio/articles"
    >
      <section className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden border-b border-slate-200 px-5 sm:px-8">
        <ArticleHeroScene />
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-7xl items-start py-24 sm:py-28 lg:items-center lg:py-20">
          <div className="max-w-3xl">
            <h1 className="portfolio-display max-w-[11ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Notes from the build.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Practical writing on frontend systems, performance, AI, and technical leadership.
            </p>
            <div className="mt-9 flex w-fit items-center gap-4 rounded-2xl bg-white/90 p-3 pr-5 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200 backdrop-blur-sm">
              <img className="size-14 rounded-xl object-cover object-top" src={applicationProfile.portrait} alt="Mico Ang" />
              <div>
                <strong className="text-sm font-semibold text-slate-950">Mico Ang</strong>
                <p className="mt-0.5 text-sm leading-6 text-slate-500">Author and technical lead</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="article-list" className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl sm:mb-12">
            <h2 className="portfolio-display text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Latest articles</h2>
            {!state.loading && !state.error ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {state.count} published {state.count === 1 ? "article" : "articles"} on building clear, durable products.
              </p>
            ) : null}
          </div>
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
              <h2 className="portfolio-display mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">The first article is being prepared.</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">Published writing will appear here as soon as it is released from the portfolio admin.</p>
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
