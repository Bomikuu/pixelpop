import { useEffect, useRef, useState } from "react";
import {
  Eye,
  Gauge,
  KeyRound,
  MousePointerClick,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";

const metricIcons = {
  "Search Console clicks": MousePointerClick,
  "Search impressions": Eye,
  "Organic traffic": Search,
  "Organic keywords": KeyRound,
  "Mobile performance score": Gauge,
  "July PQL result": Target,
};

const metricDescriptions = {
  "Search Console clicks": "From organic search visibility and SEO improvements.",
  "Search impressions": "Total search impressions from indexed pages.",
  "Organic traffic": "Users arriving through organic search.",
  "Organic keywords": "Keywords ranking across search results.",
  "Mobile performance score": "Reported Lighthouse mobile performance.",
  "July PQL result": "Product-qualified leads against the July target.",
};

const START_VALUE = 12;
const END_VALUE = 170.6;
const START_YEAR = 2021;
const TOTAL_MONTHS = 54;
const CHART_LEFT = 48;
const CHART_RIGHT = 712;
const CHART_TOP = 30;
const CHART_BOTTOM = 220;

function formatTraffic(value) {
  const precision = value >= 100 ? 1 : 0;
  return `${value.toFixed(precision)}K`;
}

function formatMetricValue(value, precision = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

function getInterpolatedDate(progress) {
  const monthOffset = Math.round((progress / 100) * TOTAL_MONTHS);
  const date = new Date(START_YEAR, monthOffset, 1);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CorticoProof({ metrics }) {
  const rootRef = useRef(null);
  const animationFrameRef = useRef(0);
  const [revealProgress, setRevealProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const selectedTraffic = START_VALUE + ((END_VALUE - START_VALUE) * progress) / 100;
  const selectedDate = getInterpolatedDate(progress);
  const markerX = CHART_LEFT + ((CHART_RIGHT - CHART_LEFT) * progress) / 100;
  const markerY = CHART_BOTTOM - ((CHART_BOTTOM - CHART_TOP) * selectedTraffic) / 200;
  const startY = CHART_BOTTOM - ((CHART_BOTTOM - CHART_TOP) * START_VALUE) / 200;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !window.IntersectionObserver) {
      setRevealProgress(1);
      setProgress(100);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const startedAt = performance.now();
      const duration = 1650;
      const animate = (now) => {
        const elapsed = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - ((1 - elapsed) ** 4);
        setRevealProgress(eased);
        setProgress(Math.round(eased * 100));
        if (elapsed < 1) animationFrameRef.current = window.requestAnimationFrame(animate);
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }, { threshold: 0.18 });

    observer.observe(root);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleProgressChange = (event) => {
    window.cancelAnimationFrame(animationFrameRef.current);
    setProgress(Number(event.target.value));
  };

  return (
    <div ref={rootRef} className="overflow-hidden border border-blue-100 bg-white text-slate-950 shadow-[0_28px_80px_-52px_rgba(37,99,235,0.32)]">
      <div className="flex flex-col gap-5 border-b border-blue-100 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <strong className="portfolio-display block text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Cortico growth impact
            </strong>
            <span className="mt-1.5 block max-w-2xl text-sm leading-6 text-slate-600">
              Search visibility, real-user performance, and product-qualified lead reporting from the supplied evidence.
            </span>
          </div>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-700">
          Supplied evidence
        </span>
      </div>

      <div className="grid gap-px bg-blue-100 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[metric.label] ?? TrendingUp;
          const finalValue = `${formatMetricValue(metric.value, metric.precision)}${metric.suffix ?? ""}`;
          const displayValue = metric.value * Math.max(0, Math.min(1, (revealProgress * 1.18) - (index * 0.035)));

          return (
            <article key={metric.label} className="min-w-0 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <strong className="portfolio-display block text-3xl font-semibold tracking-[-0.04em] text-slate-950 tabular-nums" aria-label={finalValue}>
                    <span className="sr-only">{finalValue}</span>
                    <span aria-hidden="true">{formatMetricValue(displayValue, metric.precision)}{metric.suffix ?? ""}</span>
                  </strong>
                  <span className="mt-0.5 block text-sm font-semibold text-slate-900">{metric.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {metricDescriptions[metric.label] ?? metric.detail}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="border-t border-blue-100 px-5 py-7 sm:px-8 lg:px-10 lg:py-9" aria-labelledby="cortico-traffic-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-600">
              Organic search trajectory
            </span>
            <h3 id="cortico-traffic-title" className="portfolio-display mt-1 text-xl font-semibold tracking-[-0.025em] text-slate-950">
              Traffic growth from supplied endpoints
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Drag the timeline to inspect a linear interpolation between the two reported values.
            </p>
          </div>

          <output className="w-fit border border-blue-100 bg-blue-50 px-4 py-2.5 text-right" htmlFor="cortico-traffic-range">
            <strong className="portfolio-display block text-xl font-semibold tracking-[-0.025em] text-blue-700">
              {formatTraffic(selectedTraffic)}
            </strong>
            <span className="block text-xs font-medium text-slate-500">{selectedDate}</span>
          </output>
        </div>

        <div className="mt-6 overflow-hidden border border-blue-100 bg-[linear-gradient(rgba(219,234,254,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(219,234,254,0.45)_1px,transparent_1px)] bg-[size:25%_25%] p-3 sm:p-5">
          <svg
            viewBox="0 0 760 260"
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={`Illustrative organic traffic interpolation from 12 thousand in January 2021 to 170.6 thousand in July 2025. Selected point: ${formatTraffic(selectedTraffic)} in ${selectedDate}.`}
          >
            <defs>
              <linearGradient id="cortico-traffic-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
              <filter id="cortico-marker-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {[0, 50, 100, 150, 200].map((tick) => {
              const y = CHART_BOTTOM - ((CHART_BOTTOM - CHART_TOP) * tick) / 200;

              return (
                <g key={tick}>
                  <line x1={CHART_LEFT} x2={CHART_RIGHT} y1={y} y2={y} stroke="#dbeafe" strokeWidth="1" />
                  <text x="38" y={y + 4} textAnchor="end" fill="#64748b" fontSize="11" fontWeight="600">
                    {tick === 0 ? "0" : `${tick}K`}
                  </text>
                </g>
              );
            })}

            {[2021, 2022, 2023, 2024, 2025].map((year, index) => {
              const x = CHART_LEFT + ((CHART_RIGHT - CHART_LEFT) * index) / 4;

              return (
                <g key={year}>
                  <line x1={x} x2={x} y1={CHART_TOP} y2={CHART_BOTTOM} stroke="#eff6ff" strokeWidth="1" />
                  <text x={x} y="246" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
                    {year}
                  </text>
                </g>
              );
            })}

            <path
              d={`M ${CHART_LEFT} ${startY} L ${markerX} ${markerY} L ${markerX} ${CHART_BOTTOM} L ${CHART_LEFT} ${CHART_BOTTOM} Z`}
              fill="url(#cortico-traffic-area)"
            />
            <line
              x1={CHART_LEFT}
              y1={startY}
              x2={markerX}
              y2={markerY}
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line x1={markerX} x2={markerX} y1={markerY} y2={CHART_BOTTOM} stroke="#93c5fd" strokeDasharray="4 5" />
            <circle cx={markerX} cy={markerY} r="12" fill="#2563eb" opacity="0.16" filter="url(#cortico-marker-glow)" />
            <circle cx={markerX} cy={markerY} r="5.5" fill="#2563eb" stroke="white" strokeWidth="3" />
          </svg>

          <label htmlFor="cortico-traffic-range" className="sr-only">
            Inspect Cortico organic traffic timeline
          </label>
          <input
            id="cortico-traffic-range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={progress}
            onChange={handleProgressChange}
            aria-valuetext={`${formatTraffic(selectedTraffic)} in ${selectedDate}`}
            className="mt-1 h-2 w-full cursor-ew-resize appearance-none rounded-full bg-blue-100 accent-blue-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
          />
        </div>

        <div className="mt-4 grid gap-px overflow-hidden bg-blue-100 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="flex items-center gap-3 bg-blue-50 px-5 py-4">
            <TrendingUp className="shrink-0 text-blue-600" size={22} aria-hidden="true" />
            <div>
              <strong className="portfolio-display block text-xl font-semibold tracking-[-0.02em] text-blue-700 tabular-nums" aria-label="1,322 percent increase">
                <span className="sr-only">+1,322%</span>
                <span aria-hidden="true">+{Math.round(1322 * revealProgress).toLocaleString("en-US")}%</span>
              </strong>
              <span className="block text-xs leading-5 text-slate-600">Derived increase between the two supplied endpoints.</span>
            </div>
          </div>
          <div className="bg-blue-50 px-5 py-4">
            <strong className="block text-sm font-semibold text-slate-900">Clear growth, careful reporting</strong>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              The endpoints are supplied evidence. Intermediate values are an interactive linear interpolation, not reported monthly traffic.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
