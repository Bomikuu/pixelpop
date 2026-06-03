// src/engine/dev/FlowDevTools.jsx
import React, { useMemo, useState } from "react";
import {
  saveFlow,
  loadFlow,
  listSavedFlows,
  deleteFlow,
  exportFlowJson,
  importFlowJson,
  saveSnapshot,
  loadSnapshot,
} from "../authoring/flowStorage";
import { validateFlow } from "../authoring/flowSchema";

export default function FlowDevTools({
  flow,
  runtimeVars,
  onLoadFlow,     // (flow) => void
  onPlayFromNode, // (nodeId, varsPatch?) => void
  onReset,        // () => void
}) {
  const [selectedId, setSelectedId] = useState(flow?.id || "");
  const [importText, setImportText] = useState("");
  const [nodeId, setNodeId] = useState(flow?.start || "start");
  const [varsText, setVarsText] = useState(() => JSON.stringify(runtimeVars || {}, null, 2));
  const [notice, setNotice] = useState(null);

  const saved = useMemo(() => listSavedFlows(), [flow?.id, notice]);

  const nodes = useMemo(() => {
    const ids = Object.keys(flow?.nodes || {});
    return ids.sort((a, b) => a.localeCompare(b));
  }, [flow]);

  const show = (type, message) => setNotice({ type, message, at: Date.now() });

  const doSave = () => {
    try {
      const pack = saveFlow(flow, { title: flow?.id });
      setSelectedId(pack.id);
      show("success", `Saved: ${pack.id}`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doLoad = () => {
    try {
      const f = loadFlow(selectedId);
      if (!f) return show("error", "Not found");
      const check = validateFlow(f);
      if (!check.ok) return show("error", check.errors.join(" | "));
      onLoadFlow?.(f);
      setNodeId(f.start);
      show("success", `Loaded: ${f.id}`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doDelete = () => {
    try {
      deleteFlow(selectedId);
      show("success", `Deleted: ${selectedId}`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doExport = () => {
    const txt = exportFlowJson(selectedId || flow?.id);
    if (!txt) return show("error", "Nothing to export");
    setImportText(txt);
    show("success", "Exported JSON into the textbox (copy it).");
  };

  const doImport = () => {
    try {
      const f = importFlowJson(importText);
      setSelectedId(f.id);
      onLoadFlow?.(f);
      setNodeId(f.start);
      show("success", `Imported: ${f.id}`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doSnapshotSave = () => {
    try {
      const fId = flow?.id || selectedId;
      if (!fId) return show("error", "No flow id");
      const pack = saveSnapshot(fId, runtimeVars || {});
      show("success", `Snapshot saved (${pack.savedAt})`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doSnapshotLoad = () => {
    try {
      const fId = flow?.id || selectedId;
      if (!fId) return show("error", "No flow id");
      const snap = loadSnapshot(fId);
      if (!snap) return show("error", "No snapshot found");
      setVarsText(JSON.stringify(snap, null, 2));
      show("success", "Snapshot loaded into Vars box");
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doPlay = () => {
    try {
      let patch = {};
      if (varsText?.trim()) patch = JSON.parse(varsText);
      onPlayFromNode?.(nodeId, patch);
      show("success", `Playing from "${nodeId}"`);
    } catch (e) {
      show("error", "Vars JSON invalid");
    }
  };

  return (
    <div className="border-[3px] rounded-2xl p-4 mb-4" style={{ borderColor: "var(--pp-border)", boxShadow: "var(--pp-shadow)", background: "rgba(255,255,255,0.92)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-pp font-extrabold text-sm">FLOW DEVTOOLS</div>

        <div className="flex items-center gap-2">
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doSave}>Save</button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doLoad}>Load</button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doDelete}>Delete</button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doExport}>Export</button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doImport}>Import</button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={onReset}>Reset Runtime</button>
        </div>
      </div>

      {notice ? (
        <div className="mt-3 font-pp text-xs">
          <span className={notice.type === "error" ? "text-red-600" : "text-green-700"}>
            {notice.type.toUpperCase()}:
          </span>{" "}
          {notice.message}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="font-pp text-xs font-extrabold opacity-70">Saved flows</div>
          <select
            className="w-full border-[3px] rounded-xl p-2 font-pp text-xs"
            style={{ borderColor: "var(--pp-border)" }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">(select)</option>
            {saved.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} • {s.updatedAt}
              </option>
            ))}
          </select>

          <div className="font-pp text-xs font-extrabold opacity-70 mt-3">Play from node</div>
          <select
            className="w-full border-[3px] rounded-xl p-2 font-pp text-xs"
            style={{ borderColor: "var(--pp-border)" }}
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
          >
            {nodes.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <button className="pp-btn pp-btn--primary w-full" type="button" onClick={doPlay}>
            Play From Node
          </button>

          <div className="flex gap-2">
            <button className="pp-btn pp-btn--secondary w-full" type="button" onClick={doSnapshotSave}>Save Vars Snapshot</button>
            <button className="pp-btn pp-btn--secondary w-full" type="button" onClick={doSnapshotLoad}>Load Vars Snapshot</button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-pp text-xs font-extrabold opacity-70">Vars (JSON patch)</div>
          <textarea
            className="w-full border-[3px] rounded-xl p-2 font-mono text-xs h-[180px]"
            style={{ borderColor: "var(--pp-border)" }}
            value={varsText}
            onChange={(e) => setVarsText(e.target.value)}
          />

          <div className="font-pp text-xs font-extrabold opacity-70">Import / Export JSON</div>
          <textarea
            className="w-full border-[3px] rounded-xl p-2 font-mono text-xs h-[180px]"
            style={{ borderColor: "var(--pp-border)" }}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
