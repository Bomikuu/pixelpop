# AWS Infrastructure Guide Implementation Plan

**Goal:** Add a beginner-friendly, illustrated How-to based on the 36-second AWS services video shared by Arjaythedev.

**Architecture:** A lazy portfolio route with colocated source-backed content, a category/service explorer, short knowledge checks, and a manually stepped request walkthrough. Reuse the portfolio shell and semantic appearance tokens. The generated workshop is an analogy; code diagrams carry actual service relationships.

**Tech stack:** Existing React, React Router, Lucide, CSS, and one optimized transparent WebP. No dependencies, backend changes, or AWS provisioning.

**Spec:** User request and https://www.facebook.com/61561881593546/videos/1591273889701380/. Video services verified in the browser: EC2, Lambda, RDS, DynamoDB, API Gateway, CloudFront, Route 53, S3, CloudWatch, IAM, SNS, SQS, Secrets Manager. Expanded explanations link directly to each service's AWS documentation.

## Constraints

- Preserve existing learning pages and unrelated working changes.
- No tests, builds, browser testing, commits, or deployment without a user request. Browser access here is for the explicitly requested source video.
- Keep DNS separate from HTTP traffic; distinguish AWS IAM from customer sign-in; do not imply automatic secret rotation or deployment of every service.
- Read mode in the established portfolio world: cobalt, Instrument Sans, restrained borders, responsive layouts, accessible controls, reduced motion.

## Implementation

- [x] Create `aws-infrastructure/guideContent.js` with seven job categories, thirteen services, examples, caveats, linked sources, seven checks, and two request journeys.
- [x] Create `AwsInfrastructureGuidePage.jsx`, `ServiceExplorer.jsx`, `RequestWalkthrough.jsx`, and local styles. Category and service selection reveal explanations; checks give immediate feedback; journey buttons reveal one request stage at a time. Include a printable full-service reference and a glossary.
- [x] Add the lazy route, How-tos entry, and Cloud icon. Store the generated WebP under the guide's public asset folder and its exact prompt under `output/imagegen/`.
- [x] Review only the affected source for complete video coverage, correct wiring, keyboard semantics, theme roles, and responsive rules. Record that runtime verification was not performed.

## Review focus

- Changing categories resets only the service selection; answer feedback stays associated with its category.
- Repeated answer clicks cannot change a checked answer until Try again is selected.
- DNS is a lookup step, and queued work has a consumer rather than pretending SQS executes it.
- New, incorrect, and correct states include text/icons alongside color.
- Diagrams wrap vertically on mobile, print includes every service, and motion remains optional.

## Completion evidence

Source and scoped route/index diff reviewed. The WebP preserves transparency and is 1000 by 640 pixels, approximately 100 KB. Its generation prompt is saved separately and embedded in XMP. No tests, builds, browser testing, commits, or deployment were run.
