import { useState } from "react";
import { choiceIcon } from "../../lib/presets";

function AssetSilhouette({ kind }) {
  const Icon = choiceIcon(kind);
  return <div className="grid h-full w-full place-items-center bg-slate-50">
    {["car", "house", "condo"].includes(kind) ? <svg viewBox="0 0 240 160" className="h-full w-full text-slate-300" aria-hidden="true">
      {kind === "car" ? <g fill="currentColor">
        <path d="m35 94 20-31 40-9h49l34 25 27 10v28H32V97Z" />
        <path d="m62 68 35-8h42l24 20H55Z" fill="#f8fafc" />
        <path d="M115 61v20" stroke="currentColor" strokeWidth="5" />
        <circle cx="68" cy="116" r="17" /><circle cx="174" cy="116" r="17" />
        <circle cx="68" cy="116" r="8" fill="#f8fafc" /><circle cx="174" cy="116" r="8" fill="#f8fafc" />
      </g> : <g fill="currentColor">
        <path d="m41 78 79-49 79 49-8 12-71-44-71 44Z" />
        <path d="m61 84 59-37 59 37v49H61Z" />
        <path d="M80 88h22v22H80Zm58 0h22v22h-22Zm-27 17h18v28h-18Z" fill="#f8fafc" />
      </g>}
    </svg> : <Icon className="size-16 text-slate-300" strokeWidth={1.25} aria-hidden="true" />}
  </div>;
}

// Full scene illustrations, deliberately not enlarged UI glyphs.
function AssetIllustration({ kind }) {
  const vehicle = ["car", "motorcycle"].includes(kind);
  const home = ["house", "condo"].includes(kind);
  return <svg viewBox="0 0 360 240" className="h-full w-full" aria-hidden="true">
    <rect width="360" height="240" fill="#f8fafc" />
    <path d="M0 165 Q85 126 166 160 T360 148 V240 H0Z" fill="#e2e8f0" />
    <circle cx="293" cy="48" r="21" fill="#e0f2fe" />
    <path d="M28 69h65M49 54h24M210 83h44" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
    <ellipse cx="181" cy="199" rx="123" ry="13" fill="#cbd5e1" opacity=".5" />
    {vehicle ? <g>
      <path d="M54 164 78 126 134 113h76l48 25 48 15v33H49Z" fill="#94a3b8" />
      <path d="m90 126 47-8h65l35 22-159 3Z" fill="#334155" />
      <path d="m147 120 1 23m57-21 14 21" stroke="#cbd5e1" strokeWidth="5" />
      <path d="M57 154h243v18H52Z" fill="#e2e8f0" />
      <path d="M156 150v32m85-33v29" stroke="#64748b" strokeWidth="2" />
      <path d="M167 155h14m70 0h12" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      <rect x="282" y="156" width="21" height="10" rx="3" fill="#fef3c7" />
      <rect x="54" y="154" width="13" height="11" rx="2" fill="#fda4af" />
      <path d="M53 181h251" stroke="#475569" strokeWidth="8" />
      {[99, 259].map((x) => <g key={x}><circle cx={x} cy="184" r="24" fill="#1e293b" /><circle cx={x} cy="184" r="15" fill="#cbd5e1" /><circle cx={x} cy="184" r="6" fill="#64748b" /><path d={`M${x - 11} 184h22m-11-11v22`} stroke="#f8fafc" strokeWidth="3" /></g>)}
    </g> : home ? <g>
      <path d="m92 99 84-41 96 36-80 45Z" fill="#475569" />
      <path d="m91 100 101 30v67L91 169Z" fill="#f1f5f9" />
      <path d="m192 130 78-35v77l-78 25Z" fill="#cbd5e1" />
      <path d="m95 111 96 27m5 0 69-28" stroke="#94a3b8" strokeWidth="3" />
      <path d="m110 119 25 7v29l-25-7Zm42 12 25 7v29l-25-7Z" fill="#7dd3fc" stroke="#64748b" strokeWidth="3" />
      <path d="m207 137 23-10v28l-23 9Zm37-16 15-6v28l-15 6Z" fill="#7dd3fc" stroke="#64748b" strokeWidth="3" />
      <path d="m146 165 25 7v20l-25-7Z" fill="#64748b" />
      <path d="m87 175 104 28 87-29" fill="none" stroke="#94a3b8" strokeWidth="5" />
      <path d="M58 193v-44m242 40v-40" stroke="#78716c" strokeWidth="6" />
      <circle cx="58" cy="144" r="22" fill="#86a99b" /><circle cx="299" cy="140" r="24" fill="#86a99b" />
      <path d="M74 199h51m110 0h50" stroke="#86a99b" strokeWidth="9" strokeLinecap="round" />
    </g> : <g>
      <path d="m67 172 59-31 66 25-58 31Z" fill="#b8c6d9" />
      <path d="m67 172 67 25v-54l-67-24Z" fill="#cbd5e1" />
      <path d="m134 197 58-31v-54l-58 31Z" fill="#94a3b8" />
      <path d="m67 119 59-30 66 23-58 31Z" fill="#e2e8f0" />
      <path d="m200 166 49-24 47 17-46 26Z" fill="#e2e8f0" />
      <path d="m200 166 50 19v31l-50-18Z" fill="#cbd5e1" />
      <path d="m250 185 46-26v31l-46 26Z" fill="#94a3b8" />
      <path d="m101 103 18 7v50l-18-7Z" fill="#f8fafc" />
      <path d="M266 124v-33" stroke="#78716c" strokeWidth="5" /><ellipse cx="250" cy="91" rx="19" ry="10" fill="#86a99b" /><ellipse cx="279" cy="82" rx="18" ry="10" fill="#a7c1b5" />
      <path d="m250 121 33 1-4 27h-25Z" fill="#d6c5b5" />
    </g>}
  </svg>;
}

export default function AssetImage({ src, kind, name, className = "", thumbnail = false, variant = "illustration" }) {
  const [failed, setFailed] = useState(null);
  const available = src && failed !== src;
  return <div className={`relative overflow-hidden ${variant === "silhouette" && available ? "bg-white" : "bg-slate-50"} ${className}`}>
    {available ? <img src={src} alt={thumbnail ? "" : `${name} photo`} loading="lazy" className={`h-full w-full ${thumbnail ? "object-cover" : "object-contain"}`} onError={() => setFailed(src)} /> : variant === "silhouette" ? <AssetSilhouette kind={kind} /> : <>
      <AssetIllustration kind={kind} />
      {!thumbnail && <span className="absolute bottom-2 left-0 w-full text-center text-[11px] text-slate-600">Illustrative placeholder · no photo</span>}
    </>}
  </div>;
}
