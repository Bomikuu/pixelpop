import React, { useMemo, useState } from "react";
import SceneEngine from "../engine/SceneEngine";
import FlowDevTools from "../engine/dev/FlowDevTools";
import { demoFlow } from "../engine/flows/demoFlow";
import { advancedDemoFlow } from "../engine/flows/advancedDemoFlow";
import { megaDemoFlow } from "../engine/flows/megaDemoFlow";
import { weddingMinimalFlow } from "../engine/flows/weddingMinimalFlow";

export default function SceneEngineDemo() {
  const [flow, setFlow] = useState(weddingMinimalFlow);

  // runtime vars snapshot for DevTools (SceneEngine already passes vars to panels)
  // easiest: keep a mirror using onDone callback or a tiny hook:
  const [varsMirror, setVarsMirror] = useState({});

  const handleDone = (runtime) => {
    setVarsMirror(runtime?.vars || {});
  };

  const playFromNode = (nodeId, varsPatch) => {
    // easiest: remount SceneEngine by changing a key
    setFlow((prev) => ({
      ...prev,
      __playFrom: { nodeId, varsPatch, at: Date.now() },
    }));
  };

  const engineKey = useMemo(() => {
    const p = flow?.__playFrom;
    return p ? `${flow.id}:${p.nodeId}:${p.at}` : `${flow.id}:normal`;
  }, [flow]);

  const initialNodeId = flow?.__playFrom?.nodeId;
  const initialVars = flow?.__playFrom?.varsPatch;

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <FlowDevTools
          flow={flow}
          runtimeVars={varsMirror}
          onLoadFlow={(f) => setFlow(f)}
          onPlayFromNode={(n, patch) => {
            setFlow((prev) => ({
              ...prev,
              __playFrom: { nodeId: n, varsPatch: patch, at: Date.now() },
            }));
          }}
          onReset={() => {
            setFlow((prev) => ({
              ...prev,
              __playFrom: { nodeId: prev.start, varsPatch: {}, at: Date.now() },
            }));
          }}
        />

        <SceneEngine
          key={engineKey}
          flow={flow}
          initialNodeId={initialNodeId}
          initialVars={initialVars}
          onDone={handleDone}
        />
      </div>
    </div>
  );
}

