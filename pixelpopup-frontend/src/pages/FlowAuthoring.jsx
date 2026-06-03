import React, { useMemo, useState } from "react";
import { useFlowsStore } from "../store/useFlowsStore";
import { Window, RetroButton, RetroInput, RetroPanel } from "../ui/retro";
import { overlay } from "../ui/overlay";

export default function FlowAuthoring() {
  const { flowsById, activeFlowId, setActiveFlow, upsertFlow, deleteFlow, exportFlow, importFlow } = useFlowsStore();
  const ids = useMemo(() => Object.keys(flowsById), [flowsById]);

  const [jsonText, setJsonText] = useState("");

  const loadActive = () => {
    if (!activeFlowId) return;
    const txt = exportFlow(activeFlowId);
    setJsonText(txt || "");
  };

  return (
    <div className="min-h-screen pp-retro-bg p-6">
      <div className="mx-auto max-w-6xl">
        <Window title="FLOW_AUTHORING.EXE" subtitle="JSON-based branching flow editor" maxWidthClass="max-w-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-3">
              <RetroPanel title="Flows">
                <div className="space-y-2">
                  {ids.length === 0 ? (
                    <div className="font-pp text-sm opacity-70">No flows yet.</div>
                  ) : (
                    ids.map((id) => (
                      <div key={id} className="flex items-center gap-2">
                        <RetroButton
                          variant={id === activeFlowId ? "primary" : "secondary"}
                          className="flex-1"
                          onClick={() => {
                            setActiveFlow(id);
                            setJsonText(exportFlow(id) || "");
                          }}
                        >
                          {id}
                        </RetroButton>
                        <RetroButton
                          variant="danger"
                          onClick={() => {
                            deleteFlow(id);
                            overlay.toast({ type: "info", message: `Deleted ${id}` });
                          }}
                        >
                          Del
                        </RetroButton>
                      </div>
                    ))
                  )}

                  <RetroButton
                    className="w-full"
                    onClick={() => {
                      const id = `flow_${Date.now()}`;
                      const empty = { id, version: 1, title: id, start: "start", vars: {}, nodes: { start: { scene: "TypewriterPanel", props: { title: "NEW.TXT", text: "Edit me" }, on: {} } } };
                      upsertFlow(empty);
                      setActiveFlow(id);
                      setJsonText(JSON.stringify(empty, null, 2));
                      overlay.toast({ type: "success", message: "New flow created" });
                    }}
                  >
                    New Flow
                  </RetroButton>
                </div>
              </RetroPanel>

              <RetroPanel title="Import / Export">
                <div className="flex flex-wrap gap-2">
                  <RetroButton variant="secondary" onClick={loadActive}>Load Active</RetroButton>
                  <RetroButton
                    onClick={() => {
                      try {
                        const id = importFlow(jsonText);
                        setActiveFlow(id);
                        overlay.toast({ type: "success", message: `Imported ${id}` });
                      } catch (e) {
                        overlay.toast({ type: "error", message: e.message || "Import failed" });
                      }
                    }}
                  >
                    Import JSON
                  </RetroButton>

                  <RetroButton
                    variant="ghost"
                    onClick={() => {
                      if (!activeFlowId) return;
                      navigator.clipboard.writeText(exportFlow(activeFlowId) || "");
                      overlay.toast({ type: "success", message: "Copied export to clipboard" });
                    }}
                  >
                    Copy Export
                  </RetroButton>
                </div>

                <div className="mt-3">
                  <RetroInput
                    label="Active Flow ID"
                    value={activeFlowId || ""}
                    onChange={() => {}}
                    hint="Select a flow from the list."
                    disabled
                  />
                </div>
              </RetroPanel>
            </div>

            <div className="lg:col-span-8">
              <RetroPanel title="Flow JSON">
                <textarea
                  className="w-full h-[520px] rounded-xl border p-3 font-mono text-xs bg-white/80"
                  style={{ borderColor: "rgba(0,0,0,0.2)" }}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <RetroButton
                    onClick={() => {
                      try {
                        const obj = JSON.parse(jsonText || "{}");
                        if (!obj?.id) throw new Error("Missing flow.id");
                        upsertFlow(obj);
                        setActiveFlow(obj.id);
                        overlay.toast({ type: "success", message: "Saved flow" });
                      } catch (e) {
                        overlay.toast({ type: "error", message: e.message || "Save failed" });
                      }
                    }}
                  >
                    Save
                  </RetroButton>

                  <RetroButton
                    variant="secondary"
                    onClick={() => overlay.effect({ type: "vhs", ms: 900, strength: 12 })}
                  >
                    VHS Test
                  </RetroButton>
                </div>
              </RetroPanel>
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
}
