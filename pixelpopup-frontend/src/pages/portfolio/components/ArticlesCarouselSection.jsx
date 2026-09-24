import { ArrowRight, BookOpen, BrainCircuit, Gauge, Layers3 } from "lucide-react";
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

function getArticlePositions(track) {
  const firstLeft = track.firstElementChild?.offsetLeft || 0;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  return Array.from(track.children, (card) => Math.min(card.offsetLeft - firstLeft, maxScroll));
}

function ArticleCard({ article }) {
  const CategoryIcon = categoryIcons[article.category?.name] || BookOpen;
  const author = getArticleAuthor(article);

  return (
    <article className="group w-full shrink-0 snap-start sm:w-[calc((100%_-_1.25rem)/2)] lg:w-[calc((100%_-_2.5rem)/3)]">
      <Link
        to={`/portfolio/articles/${article.slug}`}
        className="flex h-full min-h-[32rem] flex-col overflow-hidden border border-[#dce4ec] bg-white transition duration-300 ease-out hover:border-[#2f5bff]/60 hover:shadow-[0_22px_55px_-42px_rgba(15,23,42,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]"
      >
        <div className="relative grid aspect-[2.1/1] place-items-center overflow-hidden bg-[#0b1733]">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || ""}
              className="absolute inset-0 size-full object-cover transition duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
            />
          ) : (
            <CategoryIcon className="text-blue-200" size={72} strokeWidth={1.25} aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#52677d]">
            {article.category?.name ? <><span className="font-semibold text-[#2f5bff]">{article.category.name}</span><span aria-hidden="true">·</span></> : null}
            <time dateTime={article.published_at}>{formatArticleDate(article.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.reading_time_minutes} min read</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold leading-7 tracking-[-0.025em] text-[#081a30] sm:text-[1.35rem]">
            {article.title}
          </h3>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#52677d] sm:text-base sm:leading-7">{article.excerpt}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#dce4ec] pt-4 text-sm">
            <span className="inline-flex items-center gap-2.5 text-[#52677d]">
              <span className="grid size-8 place-items-center rounded-full bg-[#eef3f8] text-xs font-semibold text-[#52677d]" aria-hidden="true">{author.charAt(0)}</span>
              By {author}
            </span>
            <span className="inline-flex items-center gap-2 font-semibold text-[#2f5bff]">
              Read article
              <ArrowRight size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
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
      {["first", "second", "third"].map((item) => (
        <div key={item} className="min-h-[32rem] w-full shrink-0 animate-pulse border border-[#dce4ec] bg-white sm:w-[calc((100%_-_1.25rem)/2)] lg:w-[calc((100%_-_2.5rem)/3)] motion-reduce:animate-none">
          <div className="aspect-[2.1/1] bg-slate-200" />
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
  const [activeIndex, setActiveIndex] = useState(0);

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

    const observer = new ResizeObserver(updatePosition);
    const frame = window.requestAnimationFrame(updatePosition);
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [state.articles]);

  function goToArticle(index) {
    const track = trackRef.current;
    if (!track) return;
    const positions = getArticlePositions(track);
    setActiveIndex(index);
    track.scrollTo({
      left: positions[index] ?? positions[0],
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    track.children[index]?.querySelector("a")?.focus({ preventScroll: true });
  }

  function updatePosition() {
    const track = trackRef.current;
    if (!track) return;
    const positions = getArticlePositions(track);
    if (!positions.length) return;
    setActiveIndex((current) => {
      const selected = Math.min(current, positions.length - 1);
      return positions.reduce((closest, left, index) => (
        Math.abs(track.scrollLeft - left) < Math.abs(track.scrollLeft - positions[closest]) - 1 ? index : closest
      ), selected);
    });
  }

  return (
    <section id="articles" className="relative overflow-hidden border-b border-slate-200 bg-[#fbfdff] py-24 sm:py-32" aria-labelledby="portfolio-articles-title">
      <div className="pointer-events-none absolute right-[12%] top-12 hidden size-32 opacity-70 lg:block" style={{ backgroundImage: "radial-gradient(#aacaff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="max-w-3xl">
            <h2 id="portfolio-articles-title" className="portfolio-display text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">Writing from the <span className="text-[#2f5bff]">work.</span></h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52677d]">Practical lessons from shipping frontend systems, improving performance, using AI thoughtfully, and leading technical work.</p>
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
              {state.articles.length > 1 ? (
                <nav className="mb-5 flex flex-wrap justify-end" aria-label="Article carousel navigation">
                  {state.articles.map((article, index) => (
                    <button key={article.slug} type="button" onClick={() => goToArticle(index)} aria-label={`Show article ${index + 1}: ${article.title}`} aria-current={activeIndex === index ? "true" : undefined} className="grid size-10 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2f5bff]">
                      <span className={`size-3 rounded-full transition-colors ${activeIndex === index ? "bg-[#2f5bff]" : "bg-[#d6e0ef] hover:bg-[#9fb6df]"}`} aria-hidden="true" />
                    </button>
                  ))}
                </nav>
              ) : null}
              <div ref={trackRef} onScroll={updatePosition} role="region" aria-roledescription="carousel" tabIndex={0} className="portfolio-articles-carousel flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" aria-label="Latest articles">
                {state.articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
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
