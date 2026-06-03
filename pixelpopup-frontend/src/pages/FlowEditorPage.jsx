import React, { useState } from "react";
import FlowGraphEditor from "../engine/dev/FlowGraphEditor";
import SceneEngine from "../engine/SceneEngine";
import { megaDemoFlow } from "../engine/flows/megaDemoFlow";
import { saveFlow } from "../engine/authoring/flowStorage";

export default function FlowEditorPage() {
  // ensure mega demo exists in storage once
  React.useEffect(() => {
    try {
      saveFlow(megaDemoFlow);
    } catch {}
  }, []);

  const [runFlow, setRunFlow] = useState(null);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <FlowGraphEditor
          initialFlowId="mega-demo"
          onRunFlow={(f) => setRunFlow(f)}
        />

        {runFlow ? (
          <div className="border-[3px] rounded-2xl p-3" style={{ borderColor: "var(--pp-border)", boxShadow: "var(--pp-shadow)", background: "rgba(255,255,255,0.92)" }}>
            <div className="font-pp font-extrabold text-sm mb-2">PREVIEW (SceneEngine)</div>
            <SceneEngine flow={runFlow} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
