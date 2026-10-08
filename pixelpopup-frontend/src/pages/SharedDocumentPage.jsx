import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import DocumentPage from "../features/business-dashboard/client-workflow/DocumentPage";
import { DocumentActions } from "../features/business-dashboard/client-workflow/shared";
import "../features/personal-dashboard/styles/theme.css";

export default function SharedDocumentPage() {
  const { token } = useParams();
  const pageRef = useRef(null);
  const [record, setRecord] = useState(null);
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const previousTitle = document.title;
    const restoreMeta = [["robots", "noindex, nofollow, noarchive"], ["referrer", "no-referrer"]].map(([name, content]) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      const element = existing || document.createElement("meta");
      const previous = existing?.getAttribute("content");
      element.name = name;
      element.content = content;
      if (!existing) document.head.appendChild(element);
      return () => { if (existing) element.setAttribute("content", previous || ""); else element.remove(); };
    });
    document.title = "Shared document";
    return () => {
      document.title = previousTitle;
      restoreMeta.forEach((restore) => restore());
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading"); setRecord(null);
    fetch(`/api/v1/client-workflow/documents/share/${encodeURIComponent(token)}/`, { credentials: "omit", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((data) => { setRecord(data); setState("ready"); document.title = data.title; })
      .catch((error) => { if (error.name !== "AbortError") setState("unavailable"); });
    return () => controller.abort();
  }, [token]);
  return <main className="personal-dashboard min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-[60rem]">
      {state === "loading" && <p role="status" className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading document…</p>}
      {state === "unavailable" && <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><FileText size={28} className="mx-auto text-slate-400"/><h1 className="mt-3 text-lg font-semibold">This document is unavailable</h1><p className="mt-2 text-sm text-slate-600">The link may have expired or been revoked. Ask the sender for a new link.</p></div>}
      {record && <>
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700"><FileText size={20}/></span><div className="min-w-0"><h1 className="break-words text-lg font-semibold">{record.title}</h1><p className="mt-1 text-sm text-slate-600">Read-only document · Published {new Date(record.published_at).toLocaleDateString()}</p></div></div><div className="flex flex-wrap items-center gap-2"><DocumentActions title={record.title} body={record.body} pageRef={pageRef} onMessage={setMessage}/><a href={`/api/v1/client-workflow/documents/share/${encodeURIComponent(token)}/docx/`} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Download size={15}/>Download Word</a></div></header>
        {message && <p role="status" className="mb-4 text-sm text-slate-700">{message}</p>}
        <div className="border border-slate-200 bg-white shadow-sm"><DocumentPage body={record.body} pageRef={pageRef}/></div>
      </>}
    </div>
  </main>;
}
