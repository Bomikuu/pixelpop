import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import UiKitPage from "./pages/UiKitPage";
import OverlayPlayground from "./pages/OverlayPlayground";
import ComponentsPage from "./pages/ComponentsPage";
import SkillsPage from "./pages/SkillsPage";
import McpPage from "./pages/McpPage";
import ExamplesPlaygroundPage from "./pages/ExamplesPlaygroundPage";
import { OverlayHost } from "./ui/overlay";
import RoamingCatMascot from "./ui/mascot/RoamingCatMascot";
import PortfolioModern from "./pages/portfolio/PortfolioModern";
import PortfolioProjectPage from "./pages/portfolio/PortfolioProjectPage";
import IntroductionLetterPage from "./pages/portfolio/application/IntroductionLetterPage";
import IntroVideoPage from "./pages/portfolio/application/IntroVideoPage";
import ArticleIndexPage from "./pages/portfolio/articles/ArticleIndexPage";
import ArticleDetailPage from "./pages/portfolio/articles/ArticleDetailPage";
import InterviewReviewPage from "./pages/portfolio/interview/InterviewReviewPage";
import InterviewReferencePage from "./pages/portfolio/interview/InterviewReferencePage";
import AiPromptGuidePage from "./pages/portfolio/guide/AiPromptGuidePage";
import WorkWithMePage from "./pages/portfolio/work-with-me/WorkWithMePage";
import PortfolioServicesPage from "./pages/portfolio/services/PortfolioServicesPage";
import PortfolioServiceDetailPage from "./pages/portfolio/services/PortfolioServiceDetailPage";
import AstaLandingPage from "./pages/asta/AstaLandingPage";
import AstaTeamPage from "./pages/asta/AstaTeamPage";
import AstaServicesPage from "./pages/asta/AstaServicesPage";
import AstaServiceDetailPage from "./pages/asta/AstaServiceDetailPage";
import SceneEngineDemo from "./pages/SceningDemo";
// import FlowAuthoring from "./pages/FlowAuthoring";
import FlowEditorPage from "./pages/FlowEditorPage";
import DatePlannerPage from "./pages/DatePlannerPage";
import VisualNovelPage from "./features/visual-novel/VisualNovelPage";
import WeddingInvitationPage from "./features/wedding-invitation/WeddingInvitationPage";
import WeddingPassportPage from "./features/wedding-passport/WeddingPassportPage";
import RsvpVisualNovelPage from "./features/rsvp-visual-novel/RsvpVisualNovelPage";
import ScoreboardPage from "./features/scoreboard/ScoreboardPage";
import ScoreboardOverlayPage from "./features/scoreboard/ScoreboardOverlayPage";
export default function App() {
  return (
    <BrowserRouter>
      <OverlayHost />
      <RoamingCatMascot />

      <div className="w-full">
        <Routes>
          <Route path="/ui" element={<UiKitPage />} />
          <Route path="/overlay-playground" element={<OverlayPlayground />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/skill" element={<SkillsPage />} />
          <Route path="/mcp" element={<McpPage />} />
          <Route path="/examples/playground" element={<ExamplesPlaygroundPage />} />
          <Route path="/portfolio" element={<PortfolioModern />} />
          <Route path="/portfolio/introduction-letter" element={<IntroductionLetterPage />} />
          <Route path="/portfolio/introduction-letter/:coverLetterSlug" element={<IntroductionLetterPage />} />
          <Route path="/portfolio/intro-video" element={<IntroVideoPage />} />
          <Route path="/portfolio/articles" element={<ArticleIndexPage />} />
          <Route path="/portfolio/articles/:articleSlug" element={<ArticleDetailPage />} />
          <Route path="/portfolio/interview-review" element={<InterviewReviewPage />} />
          <Route path="/portfolio/interview-reference" element={<InterviewReferencePage />} />
          <Route path="/portfolio/ai-prompt-guide" element={<AiPromptGuidePage />} />
          <Route path="/portfolio/work-with-me" element={<WorkWithMePage />} />
          <Route path="/portfolio/services" element={<PortfolioServicesPage />} />
          <Route path="/portfolio/services/:serviceSlug" element={<PortfolioServiceDetailPage />} />
          <Route path="/work-with-me" element={<Navigate to="/portfolio/work-with-me" replace />} />
          <Route path="/portfolio/:projectSlug" element={<PortfolioProjectPage />} />
          <Route path="/asta" element={<AstaLandingPage />} />
          <Route path="/asta/team" element={<AstaTeamPage />} />
          <Route path="/asta/services" element={<AstaServicesPage />} />
          <Route path="/asta/services/:serviceSlug" element={<AstaServiceDetailPage />} />
          <Route path="/scene-engine" element={<SceneEngineDemo />} />
          <Route path="/flow-editor" element={<FlowEditorPage />} />
          <Route path="/demo-all" element={<Navigate to="/examples/playground" replace />} />
          <Route path="/date-planner" element={<DatePlannerPage />} />
          <Route path="/visual-novel" element={<VisualNovelPage />} />
          <Route path="/wedding-invitation" element={<WeddingInvitationPage />} />
          <Route path="/wedding-rsvp" element={<WeddingPassportPage />} />
          <Route path="/rsvp-visual-novel" element={<RsvpVisualNovelPage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/scoreboard-overlay" element={<ScoreboardOverlayPage />} />
          {/* <Route path="/flow-author" element={<FlowAuthoring />} /> */}

          {/* default */}
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          {/* fallback */}
          <Route path="*" element={<Navigate to="/porfolio" replace />} />
        </Routes>
      </div>

    </BrowserRouter>
  );
}
