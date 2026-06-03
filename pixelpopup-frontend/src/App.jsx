import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

import UiKitPage from "./pages/UiKitPage";
import OverlayPlayground from "./pages/OverlayPlayground";
import { OverlayHost } from "./ui/overlay";
import PortfolioRetro from "./pages/PortfolioRetro";
import SceneEngineDemo from "./pages/SceningDemo";
import DemoAll from "./pages/DemoType";
// import FlowAuthoring from "./pages/FlowAuthoring";
import FlowEditorPage from "./pages/FlowEditorPage";
import DatePlannerPage from "./pages/DatePlannerPage";
export default function App() {
  return (
    <BrowserRouter>
      <OverlayHost />

      <div className="w-screen">
              <Routes>
        <Route path="/ui" element={<UiKitPage />} />
        <Route path="/overlay-playground" element={<OverlayPlayground />} />
        <Route path="/portfolio" element={<PortfolioRetro />} />
        <Route path="/scene-engine" element={<SceneEngineDemo />} />
        <Route path="/flow-editor" element={<FlowEditorPage />} />
        <Route path="/demo-all" element={<DemoAll />} />
        <Route path="/date-planner" element={<DatePlannerPage />} />
        {/* <Route path="/flow-author" element={<FlowAuthoring />} /> */}

        {/* default */}
        <Route path="/" element={<Navigate to="/ui" replace />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/ui" replace />} />
      </Routes>
      </div>

    </BrowserRouter>
  );
}
