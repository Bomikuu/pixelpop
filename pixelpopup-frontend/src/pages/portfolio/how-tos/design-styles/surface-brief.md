# Design styles to recognize

- Mode: Read.
- Route: `/portfolio/how-tos/design-styles`.
- Audience: people learning to recognize visual choices and describe them in useful AI prompts.
- Source: the existing 14 entries in `../designStyles.js`, retaining their names, explanations, uses, cautions and video attribution.
- Visual world: inherit the portfolio's Instrument Sans, Saira Condensed, cobalt actions, neutral surfaces and shared light/dark tokens. Individual teaching images illustrate their own styles; the page chrome stays consistent.
- Dials: design variance 4/10, motion intensity 2/10, visual density 4/10.
- Composition: illustrated gallery first, category explanations, one selected style with recognition notes and a prompt builder, then a short prompting method.
- Interaction: filter the gallery, select a style, preserve that choice in the URL, adapt interface/illustration prompts, copy or download Markdown. No AI service requests.
- Responsive: four gallery columns on large screens, three on medium screens, two on phones; the style detail and builder stack below 800px. No sticky rails or overlays.
- Accessibility: labeled fields and native radios/buttons, text and icons for selection, visible focus, clipboard recovery, intrinsic image sizes, reduced-motion behavior and descriptive selected-image alt text.
- Assets: 14 separately generated Study studio examples, optimized to 768×512 WebP. Exact prompts live in `docs/image-generation/design-style-examples.md`; the public asset manifest records original paths and bytes.
- Preservation: old how-to index style anchors redirect to this page. Other guide routes and source content remain unchanged.
- Validation boundary: source and generated-art review only; no automated tests, builds or browser checks without an explicit user testing request.
