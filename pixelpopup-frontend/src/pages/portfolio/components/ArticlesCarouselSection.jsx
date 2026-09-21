import { ArrowRight, BookOpen, BrainCircuit, ChevronLeft, ChevronRight, Gauge, Layers3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles } from "../api/portfolioApi";
import { formatArticleDate, getArticleAuthor } from "../articles/articleUtils";
import Reveal from "./Reveal";

const categoryIcons = {
  "AI and Delivery": BrainCircuit,
  "Frontend Engineering": Layers3,
  "Performance and SEO": Gauge,
};

function ArticleCard({ article, featured }) {
  const CategoryIcon = categoryIcons[article.category?.name] || BookOpen;

  return (
    <article className={`${featured ? "w-[min(88vw,44rem)]" : "w-[min(82vw,25rem)]"} group h-full shrink-0 snap-start`}>
      <Link
        to={`/portfolio/articles/${article.slug}`}
        className="flex h-full min-h-[27rem] flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition duration-300 ease-out hover:-translate-y-1 hover:ring-[#2f5bff]/60 hover:shadow-[0_28px_70px_-46px_rgba(15,23,42,0.55)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
      >
        <div className={`${featured ? "min-h-48 sm:min-h-56" : "min-h-40"} relative grid place-items-center overflow-hidden bg-[#0b1733]`}>
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || ""}
              className="absolute inset-0 size-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <CategoryIcon className="text-blue-200 transition duration-500 ease-out group-hover:-translate-y-1 group-hover:rotate-[-4deg] group-hover:scale-105" size={featured ? 86 : 64} strokeWidth={1.25} aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500">
            {article.category?.name ? <span className="text-[#2448d8]">{article.category.name}</span> : null}
            <span>{formatArticleDate(article.published_at)}</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
          <h3 className={`${featured ? "sm:text-3xl" : "sm:text-2xl"} portfolio-display mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950`}>
            {article.title}
          </h3>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{article.excerpt}</p>
          <div className="mt-auto flex items-center justify-between gap-4 pt-7 text-sm">
            <span className="text-slate-500">By {getArticleAuthor(article)}</span>
            <span className="inline-flex items-center gap-2 font-semibold text-[#2448d8]">
              Read article
              <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ArticleCarouselSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden" aria-busy="true" aria-label="Loading articles">
      {["featured", "second", "third"].map((item, index) => (
        <div key={item} className={`${index === 0 ? "w-[min(88vw,44rem)]" : "w-[min(82vw,25rem)]"} min-h-[27rem] shrink-0 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200`}>
          <div className="h-48 bg-slate-200" />
          <div className="space-y-4 p-7">
            <div className="h-3 w-36 bg-slate-200" />
            <div className="h-8 w-4/5 bg-slate-200" />
            <div className="h-20 bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArticlesCarouselSection() {
  const trackRef = useRef(null);
  const [state, setState] = useState({ articles: [], loading: true, error: "" });
  const [position, setPosition] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const controller = new AbortController();
    getArticles({ page: 1 }, controller.signal)
      .then((data) => setState({ articles: data.results || [], loading: false, error: "" }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ articles: [], loading: false, error: "Articles are temporarily unavailable." });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const updatePosition = () => {
      const remaining = track.scrollWidth - track.clientWidth - track.scrollLeft;
      setPosition({ atStart: track.scrollLeft <= 4, atEnd: remaining <= 4 });
    };
    const observer = new ResizeObserver(updatePosition);
    const frame = window.requestAnimationFrame(updatePosition);
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [state.articles]);

  function moveCarousel(direction) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.72, 320), behavior: "smooth" });
  }

  function updatePosition() {
    const track = trackRef.current;
    if (!track) return;
    const remaining = track.scrollWidth - track.clientWidth - track.scrollLeft;
    setPosition({ atStart: track.scrollLeft <= 4, atEnd: remaining <= 4 });
  }

  const featuredSlug = state.articles.find((article) => article.is_featured)?.slug || state.articles[0]?.slug;

  return (
    <section id="articles" className="overflow-hidden border-b border-slate-200 bg-[#f8fafc] py-24 sm:py-32" aria-labelledby="portfolio-articles-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="max-w-3xl">
            <h2 id="portfolio-articles-title" className="portfolio-display text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">Writing from the work.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Practical notes on frontend systems, performance, AI, and technical leadership.</p>
          </header>
        </Reveal>

        <Reveal className="mt-10">
          {state.loading ? <ArticleCarouselSkeleton /> : null}

          {!state.loading && state.error ? (
            <div className="border-y border-slate-300 py-10" role="status">
              <p className="font-medium text-slate-700">{state.error}</p>
            </div>
          ) : null}

          {!state.loading && !state.error && state.articles.length > 0 ? (
            <>
              <div className="mb-5 flex justify-end gap-2">
                <button type="button" onClick={() => moveCarousel(-1)} disabled={position.atStart} className="grid size-11 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-[#2f5bff] hover:text-[#2448d8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" aria-label="Previous articles">
                  <ChevronLeft size={19} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => moveCarousel(1)} disabled={position.atEnd} className="grid size-11 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-[#2f5bff] hover:text-[#2448d8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]" aria-label="Next articles">
                  <ChevronRight size={19} aria-hidden="true" />
                </button>
              </div>
              <div ref={trackRef} onScroll={updatePosition} className="portfolio-articles-carousel flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5" aria-label="Latest articles">
                {state.articles.map((article) => <ArticleCard key={article.slug} article={article} featured={article.slug === featuredSlug} />)}
              </div>
            </>
          ) : null}

          <div className="mt-8 flex justify-center">
            <Link to="/portfolio/articles" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2149dc] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
              View more articles <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
