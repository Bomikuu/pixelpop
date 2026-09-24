import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { OverlayHost } from "./ui/overlay";
import RoamingCatMascot from "./ui/mascot/RoamingCatMascot";
import PortfolioModern from "./pages/portfolio/PortfolioModern";
const UiKitPage = lazy(() => import("./pages/UiKitPage"));
const OverlayPlayground = lazy(() => import("./pages/OverlayPlayground"));
const ComponentsPage = lazy(() => import("./pages/ComponentsPage"));
const SkillsPage = lazy(() => import("./pages/SkillsPage"));
const McpPage = lazy(() => import("./pages/McpPage"));
const ExamplesPlaygroundPage = lazy(() => import("./pages/ExamplesPlaygroundPage"));
const PortfolioProjectPage = lazy(() => import("./pages/portfolio/PortfolioProjectPage"));
const IntroductionLetterPage = lazy(() => import("./pages/portfolio/application/IntroductionLetterPage"));
const IntroVideoPage = lazy(() => import("./pages/portfolio/application/IntroVideoPage"));
const WorkSetupPage = lazy(() => import("./pages/portfolio/application/WorkSetupPage"));
const ArticleIndexPage = lazy(() => import("./pages/portfolio/articles/ArticleIndexPage"));
const ArticleDetailPage = lazy(() => import("./pages/portfolio/articles/ArticleDetailPage"));
const InterviewReviewPage = lazy(() => import("./pages/portfolio/interview/InterviewReviewPage"));
const InterviewReferencePage = lazy(() => import("./pages/portfolio/interview/InterviewReferencePage"));
const AiPromptGuidePage = lazy(() => import("./pages/portfolio/guide/AiPromptGuidePage"));
const WorkWithMePage = lazy(() => import("./pages/portfolio/work-with-me/WorkWithMePage"));
const PortfolioServicesPage = lazy(() => import("./pages/portfolio/services/PortfolioServicesPage"));
const PortfolioServiceDetailPage = lazy(() => import("./pages/portfolio/services/PortfolioServiceDetailPage"));
const AstaLandingPage = lazy(() => import("./pages/asta/AstaLandingPage"));
const AstaTeamPage = lazy(() => import("./pages/asta/AstaTeamPage"));
const AstaServicesPage = lazy(() => import("./pages/asta/AstaServicesPage"));
const AstaServiceDetailPage = lazy(() => import("./pages/asta/AstaServiceDetailPage"));
const SceneEngineDemo = lazy(() => import("./pages/SceningDemo"));
const FlowEditorPage = lazy(() => import("./pages/FlowEditorPage"));
const DatePlannerPage = lazy(() => import("./pages/DatePlannerPage"));
const VisualNovelPage = lazy(() => import("./features/visual-novel/VisualNovelPage"));
const WeddingInvitationPage = lazy(() => import("./features/wedding-invitation/WeddingInvitationPage"));
const WeddingPassportPage = lazy(() => import("./features/wedding-passport/WeddingPassportPage"));
const RsvpVisualNovelPage = lazy(() => import("./features/rsvp-visual-novel/RsvpVisualNovelPage"));
const ScoreboardPage = lazy(() => import("./features/scoreboard/ScoreboardPage"));
const ScoreboardOverlayPage = lazy(() => import("./features/scoreboard/ScoreboardOverlayPage"));
export default function App() {
  return (
    <BrowserRouter>
      <OverlayHost />
      <RoamingCatMascot />

      <div className="w-full">
        <Suspense fallback={<main className="min-h-screen bg-[#f8fafc]" aria-busy="true" />}>
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
          <Route path="/portfolio/work-setup" element={<WorkSetupPage />} />
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

          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          {/* fallback */}
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
        </Suspense>
      </div>

    </BrowserRouter>
  );
}
