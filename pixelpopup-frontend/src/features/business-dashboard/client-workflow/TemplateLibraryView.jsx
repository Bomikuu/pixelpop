import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { workflowRecords } from "./api";
import DocumentEditor from "./DocumentEditor";
import { EmptyState, Panel, StatusNotice } from "./shared";

export default function TemplateLibraryView({ csrf, onDirtyChange }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const reportDirty = useCallback((value) => { setDirty(value); onDirtyChange?.(value); }, [onDirtyChange]);
  useEffect(() => { workflowRecords("templates", {}, csrf).then((data) => { setTemplates(data); setSelected(data[0]?.id || null); }).catch((cause) => setError(cause.message)).finally(() => setLoading(false)); }, [csrf]);
  const current = templates.find((item) => item.id === selected);
  return <div className="space-y-5"><Panel title="Reusable templates" description="These are starting points. Each new project receives its own independent copy."><StatusNotice error={error}/>{loading ? <p className="text-sm text-slate-500">Loading templates…</p> : templates.length ? <div role="group" aria-label="Choose a template" className="flex flex-wrap gap-2">{templates.map((item) => <button type="button" aria-pressed={item.id === selected} key={item.id} onClick={() => { if (!dirty || window.confirm("Discard unsaved document changes?")) setSelected(item.id); }} className={`rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${item.id === selected ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"}`}>{item.title}</button>)}</div> : <EmptyState icon={FileText} title="No templates available" description="Refresh the page to initialize your private template set."/>}</Panel>{current && <DocumentEditor key={current.id} document={current} resource="templates" csrf={csrf} onDirtyChange={reportDirty} onSaved={(saved) => setTemplates((old) => old.map((item) => item.id === saved.id ? saved : item))}/>}</div>;
}
