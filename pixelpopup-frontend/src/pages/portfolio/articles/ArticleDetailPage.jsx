import { ArrowLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import ApplicationPageShell from "../application/ApplicationPageShell";
import { applicationProfile } from "../application/applicationData";
import { getArticle } from "../api/portfolioApi";
import { formatArticleDate, getArticleAuthor } from "./articleUtils";

const markdownComponents = {
  h2: ({ children }) => <h2 className="portfolio-display mt-14 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">{children}</h2>,
  h3: ({ children }) => <h3 className="portfolio-display mt-10 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{children}</h3>,
  p: ({ children }) => <p className="mt-6 text-lg leading-9 text-slate-700">{children}</p>,
  a: ({ href, children }) => <a href={href} className="font-semibold text-[#2448d8] underline decoration-blue-200 underline-offset-4 hover:decoration-[#2f5bff] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">{children}</a>,
  ul: ({ children }) => <ul className="mt-6 list-disc space-y-3 pl-6 text-lg leading-8 text-slate-700 marker:text-[#2f5bff]">{children}</ul>,
  ol: ({ children }) => <ol className="mt-6 list-decimal space-y-3 pl-6 text-lg leading-8 text-slate-700 marker:font-semibold marker:text-[#2448d8]">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-10 border-l border-[#2f5bff] pl-6 text-xl font-medium leading-9 text-slate-800">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-900">{children}</code>,
  pre: ({ children }) => <pre className="my-8 overflow-x-auto rounded-xl bg-[#0b1733] p-5 text-sm leading-7 text-slate-100">{children}</pre>,
  hr: () => <hr className="my-12 border-slate-200" />,
};

function ArticleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44" aria-busy="true" aria-label="Loading article">
      <div className="h-4 w-40 animate-pulse bg-slate-200" />
      <div className="mt-8 h-16 w-full animate-pulse bg-slate-200" />
      <div className="mt-4 h-16 w-4/5 animate-pulse bg-slate-200" />
      <div className="mt-10 h-72 animate-pulse bg-slate-100" />
    </div>
  );
}

export default function ArticleDetailPage() {
  const { articleSlug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getArticle(articleSlug, controller.signal)
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.status === 404 ? "This article is not published or could not be found." : "This article could not be loaded right now.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [articleSlug, retryKey]);

  return (
    <ApplicationPageShell
      title={article?.seo_title || article?.title || "Article"}
      description={article?.seo_description || article?.excerpt || "Article by Mico Ang."}
      canonicalPath={`/portfolio/articles/${articleSlug}`}
    >
      {loading ? <ArticleDetailSkeleton /> : null}

      {!loading && error ? (
        <section className="px-5 pb-24 pt-36 sm:px-8 sm:pt-44" role="alert">
          <div className="mx-auto max-w-4xl border-y border-slate-300 py-14">
            <h1 className="portfolio-display text-4xl font-semibold tracking-[-0.035em] text-slate-950">Article unavailable</h1>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">{error}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f5bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                Try again <RefreshCw size={16} aria-hidden="true" />
              </button>
              <Link to="/portfolio/articles" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#2f5bff] hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f5bff]">
                <ArrowLeft size={16} aria-hidden="true" /> All articles
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && !error && article ? (
        <article>
          <header className="border-b border-slate-200 px-5 pb-14 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
            <div className="mx-auto max-w-5xl">
              <Link to="/portfolio/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">
                <ArrowLeft size={16} aria-hidden="true" /> All articles
              </Link>
              <h1 className="portfolio-display mt-8 text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">{article.title}</h1>
              <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">{article.excerpt}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-300 pt-5 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{getArticleAuthor(article)}</span>
                <span>{formatArticleDate(article.published_at)}</span>
                <span>{article.reading_time_minutes} min read</span>
                {article.category?.name ? <span className="font-semibold text-[#2448d8]">{article.category.name}</span> : null}
              </div>
            </div>
          </header>

          {article.cover_image_url ? (
            <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16">
              <img src={article.cover_image_url} alt={article.cover_image_alt || ""} className="max-h-[42rem] w-full object-cover" />
            </div>
          ) : null}

          <div className="px-5 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[14rem_minmax(0,46rem)] lg:justify-center lg:gap-16">
              <aside className="self-start border-t border-slate-300 pt-5 lg:sticky lg:top-32" aria-label="Article author">
                <img src={applicationProfile.portrait} alt="Mico Ang" className="size-20 rounded-full object-cover object-top" />
                <p className="mt-5 text-sm font-semibold text-slate-950">Written by Mico Ang</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Senior frontend engineer and Co-founder & Technical Lead at ASTA Softwares.</p>
                {article.author?.linkedin_url ? (
                  <a href={article.author.linkedin_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2448d8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f5bff]">
                    LinkedIn <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                ) : null}
              </aside>
              <div className="min-w-0">
                {article.content_format === "markdown" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{article.content}</ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap text-lg leading-9 text-slate-700">{article.content}</div>
                )}
                {article.tags?.length ? (
                  <div className="mt-14 flex flex-wrap gap-2 border-t border-slate-200 pt-7" aria-label="Article tags">
                    {article.tags.map((tag) => <span key={tag.slug} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">{tag.name}</span>)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ) : null}
    </ApplicationPageShell>
  );
}
