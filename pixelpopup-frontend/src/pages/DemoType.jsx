import React from "react";
import SceneEngine from "../engine/SceneEngine";
import { demoFlow } from "../engine/flows/demoFlow";
import { advancedDemoFlow } from "../engine/flows/advancedDemoFlow";
import { megaDemoFlow } from "../engine/flows/megaDemoFlow";

export default function SceneEngineDemo() {
  return (
    <div className="min-h-screen pp-retro-bg w-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* <SceneEngine flow={demoFlow} /> */}
        {/* <SceneEngine flow={advancedDemoFlow} /> */}
        <SceneEngine flow={megaDemoFlow} />
      </div>
    </div>
  );
}
