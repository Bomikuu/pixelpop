import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DocumentPage({ body, pageRef, allowImages = true }) {
  return <article ref={pageRef} className="workflow-document mx-auto min-h-[38rem] max-w-[52rem] bg-white px-6 py-8 font-sans text-[15px] leading-[1.65] text-slate-950 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      ...(!allowImages && { img: () => null }),
      h1: ({ children }) => <h1 className="mb-8 border-b-[3px] border-slate-950 pb-3 text-center text-2xl font-bold uppercase leading-tight tracking-tight sm:text-[1.75rem]">{children}</h1>,
      h2: ({ children }) => <h2 className="mb-3 mt-9 break-after-avoid text-[15px] font-bold uppercase tracking-wide">{children}</h2>,
      h3: ({ children }) => <h3 className="mb-2 mt-6 break-after-avoid text-[15px] font-bold">{children}</h3>,
      p: ({ children }) => <p className="mb-4 whitespace-pre-line">{children}</p>,
      ul: ({ children }) => <ul className="mb-5 list-disc space-y-1 pl-6">{children}</ul>,
      ol: ({ children }) => <ol className="mb-5 list-decimal space-y-1 pl-6">{children}</ol>,
      li: ({ children }) => <li className="pl-1">{children}</li>,
      table: ({ children }) => <div className="mb-5 overflow-x-auto"><table className="w-full border-collapse text-left text-[14px]">{children}</table></div>,
      th: ({ children }) => <th className="border-b border-slate-600 px-2 py-2 align-top font-bold first:pl-0 last:pr-0">{children}</th>,
      td: ({ children }) => <td className="border-b border-slate-200 px-2 py-2 align-top first:pl-0 last:pr-0">{children}</td>,
      hr: () => <hr className="my-7 border-0 border-t border-slate-400"/>,
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ children }) => <code className="rounded-sm bg-slate-100 px-0.5 font-mono text-[0.9em]">{children}</code>,
    }}>{body || ""}</ReactMarkdown>
  </article>;
}
