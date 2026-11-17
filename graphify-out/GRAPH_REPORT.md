# Graph Report - job-applications  (2026-10-22)

## Corpus Check
- Corpus is ~38,255 words - fits in a single context window. You may not need a graph.

## Summary
- 358 nodes · 1268 edges · 10 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Application API access
- Section editing and ordering
- Resume tailoring workflow
- Resume JSON contract
- Application API access
- Application workflow orchestration
- Application API access
- AI generation settings
- AI request activity
- Proposal review decisions

## God Nodes (most connected - your core abstractions)
1. `jobApi()` - 72 edges
2. `ApplicationDetail()` - 58 edges
3. `fieldError()` - 33 edges
4. `focusInvalidField()` - 19 edges
5. `sectionContent()` - 17 edges
6. `ResumeBuilder()` - 16 edges
7. `ArtifactEditor()` - 15 edges
8. `JobApplicationsView()` - 14 edges
9. `isResumeReport()` - 14 edges
10. `ResumeClarificationForm()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `revisions()` --calls--> `jobApi()`  [EXTRACTED]
  ArtifactEditor.jsx → api.js
- `finish()` --calls--> `jobApi()`  [EXTRACTED]
  ProposalReview.jsx → api.js
- `submit()` --calls--> `focusInvalidField()`  [EXTRACTED]
  ResumeSectionForm.jsx → api.js
- `AIActivityPanel()` --calls--> `isResumeReport()`  [EXTRACTED]
  AIActivityPanel.jsx → api.js
- `ApplicationDetail()` --calls--> `AIActivityPanel()`  [EXTRACTED]
  ApplicationDetail.jsx → AIActivityPanel.jsx

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Application API access"
Cohesion: 0.08
Nodes (25): fieldError(), focusInvalidField(), packageKinds, statuses, ClarificationBatchReview(), sourceLabels, FollowUpForm(), submit() (+17 more)

### Community 1 - "Section editing and ordering"
Cohesion: 0.07
Nodes (38): actionLabels, ApplicationChecklist(), readableDate(), states, ApplicationListItem(), ApplicationOverview(), markdown, AssessmentCoverage() (+30 more)

### Community 2 - "Resume tailoring workflow"
Cohesion: 0.12
Nodes (15): labels, ApplicationHistory(), generationState(), ApplicationTimeline(), EventItem(), groups, icons, AssessmentComparison() (+7 more)

### Community 3 - "Resume JSON contract"
Cohesion: 0.09
Nodes (19): downloadFile(), ArtifactEditor(), download(), printReviewedResume(), revisions(), guides, ProviderSetupGuide(), setupFlow (+11 more)

### Community 4 - "Application API access"
Cohesion: 0.10
Nodes (31): csrfToken(), jobApi(), ApplicantProfileForm(), submit(), upload(), ApplicationActivityForm(), submit(), ApplicationConversionForm() (+23 more)

### Community 5 - "Application workflow orchestration"
Cohesion: 0.11
Nodes (25): ApplicationDetail(), applySection(), beginOperation(), changeSection(), changeWorkspace(), checklistAction(), editResumeSection(), inspectRequirement() (+17 more)

### Community 6 - "Application API access"
Cohesion: 0.22
Nodes (10): generationLabel(), isResumeReport(), ApplicationBudget(), usd(), ApplicationUsage(), ExperienceExampleReview(), GenerationQuoteDialog(), GenerationResultBanner() (+2 more)

### Community 7 - "AI generation settings"
Cohesion: 0.11
Nodes (4): ApplicationAISettings(), save(), states, TailoringPreferences()

### Community 8 - "AI request activity"
Cohesion: 0.16
Nodes (11): AIActivityPanel(), elapsed(), states, ClaudeIcon(), DeepSeekIcon(), GeminiIcon(), logos, OpenAIIcon() (+3 more)

### Community 9 - "Proposal review decisions"
Cohesion: 0.31
Nodes (8): decisions(), ProposalReview(), change(), finish(), performNavigation(), save(), ProposalSection(), TextChanges()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `jobApi()` connect `Application API access` to `Application API access`, `Resume tailoring workflow`, `Resume JSON contract`, `Application workflow orchestration`, `Application API access`, `AI generation settings`, `Proposal review decisions`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Should `Application API access` be split into smaller, more focused modules?**
  _Cohesion score 0.08382936507936507 - nodes in this community are weakly interconnected._
- **Why does `ApplicationDetail()` connect `Application workflow orchestration` to `Application API access`, `Section editing and ordering`, `Resume tailoring workflow`, `Resume JSON contract`, `Application API access`, `Application API access`, `AI request activity`, `Proposal review decisions`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Should `Section editing and ordering` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
- **Why does `fieldError()` connect `Application API access` to `Resume tailoring workflow`, `Application API access`, `Application workflow orchestration`, `AI generation settings`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `Resume tailoring workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.11530398322851153 - nodes in this community are weakly interconnected._
- **Should `Resume JSON contract` be split into smaller, more focused modules?**
  _Cohesion score 0.08773784355179703 - nodes in this community are weakly interconnected._

## Extraction limitations

This graph covers application source code only; provider logo/license assets were excluded. Structural extraction flagged the following raw-reference integrity limits; the graph is a navigation aid and direct source review remains necessary:

- dangling_endpoint_edges: 387
- missing_endpoint_edges: 0
- self_loop_edges: 0
- undirected_same_endpoint_collapsed_edges: 30

Graphify structural extraction used 0 LLM tokens. The separately requested JEV plan assessment used 478 input tokens and 17 output tokens and returned 2.83/3 (confidence 0.82). This is a plan judgment, not runtime validation or a resume score.

The graph artifacts were written to the working tree under graphify-out/.
