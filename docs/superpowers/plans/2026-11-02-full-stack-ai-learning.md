# Full-stack AI learning guide implementation plan

**Goal:** Turn the seven topic slides in the supplied Facebook video into a public, interactive study guide and quiz.

**Architecture:** Extend the existing How-tos library and `ApplicationPageShell`. Keep the curriculum, interactive demonstrations, quiz, and page layout in focused files under `how-tos/full-stack-ai/`. Use React state and browser-local study progress; no backend or dependencies.

**Spec:** User request and verified frames of Himanshu Raj Singour's video `1429686212124126`: Backend, DSA, HLD, LLD, AI Agentic, DevOps, Cyber Security, twenty topics each.

**Constraints:** Preserve the portfolio identity, navigation, themes, and existing guides. No automatic tests, builds, browser validation, commits, or deployment. Existing dashboard edits remain untouched.

## Tasks

- [x] Capture all 140 topic names and add original explanations, examples, pitfalls, practice prompts, and primary references.
- [x] Add seven interactive demonstrations: request lifecycle, binary search, load distribution, strategy composition, retrieval, release routing, and authorization.
- [x] Build accessible category/topic navigation, global search, shareable topic URLs, and locally saved review progress.
- [x] Add category and mixed quizzes with feedback, explanations, results, lesson links, and missed-question retry.
- [x] Register the lazy route and add the guide to the existing How-tos index.
- [x] Review the scoped source diff against the design pre-flight. Leave runtime verification to the user per project instructions.

Source review covered topic IDs and quiz links, bounded quiz selection, answer scoring/retry, storage validation, focus targets, semantic controls, theme roles, mobile layout rules, and reduced-motion styling. No runtime or visual verification was performed.

## Review focus

Invalid topic URLs fall back safely. Unavailable/corrupt local storage does not block learning. Category changes do not mix quiz attempts. Search has an explicit empty state. Keyboard controls, narrow screens, dark theme, and reduced motion retain readable content.
