# Pixel-game educational illustration guide

## Saved project assets

The hero also received the background-only refinement below. Other sprites retained their first generated version. Transparent RGB preview halos may remain visible in viewers that ignore alpha; inspect the actual alpha channel before assuming the cutout has an opaque backdrop.

### Hero cutout refinement

```text
Use case: background-extraction. Image 1 is the EDIT TARGET, a pixel-art infrastructure village. Image 2 is STYLE REFERENCE ONLY. Preserve the exact village layout, characters, platforms, awning, computer, file cabinet, shelves, task trays, monitoring screen, locked cabinet, colors and stepped pixel detail. Change only the background and alpha boundary: remove ALL diffuse green, blue and brown ambient halo, colored glow, smoky vignette, and semitransparent shading floating outside the island. Exterior background must be genuinely fully transparent (alpha zero), with a clean stepped pixel silhouette around foliage, buildings and the stone/grass island. Content inside the silhouette must be opaque. No soft shadow or glow behind the cutout. Do not remove or rearrange any object. No text or new elements. Keep the landscape 3:2 composition and entire island visible. This is a crisp 2D game sprite cutout.
```

Generation mode: built-in Imagegen. Originals remain at their generated paths. The exact original paths, optimized paths, dimensions and file sizes are recorded in `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/pixel-v2.sources.json`.

| Asset | Project path |
| --- | --- |
| hero | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/cloud-village-pixel-v2.webp` |
| compute | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/compute-pixel-v2.webp` |
| database | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/database-pixel-v2.webp` |
| networking | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/networking-pixel-v2.webp` |
| storage | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/storage-pixel-v2.webp` |
| monitoring | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/monitoring-pixel-v2.webp` |
| security | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/security-pixel-v2.webp` |
| messaging | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/messaging-pixel-v2.webp` |
| situation-page | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/situation-page-pixel-v2.webp` |
| situation-order | `pixelpopup-frontend/public/portfolio/assets/how-tos/aws-infrastructure/illustrations/situation-order-pixel-v2.webp` |

The earlier workshop assets remain available. The AWS guide now consumes the `pixel-v2` versions. Official service logos remain unchanged SVG assets.

Use this reusable art-direction file with the built-in Imagegen tool to generate illustrations matching the attached 2D game reference. This is a project recipe, not an installed global skill.

## Visual specification

- Reference: `output/imagegen/references/pixel-game-style.png` (user-supplied reference, use for style only).
- Technique: crisp 2D pixel sprites with isometric environments, stepped edges and limited color ramps.
- Characters: chibi proportions, square-cut hair, simple expressive faces, consistent outfits across scenes.
- Environment: tiled stone platforms, grass edges, cubical foliage, blue awnings and compact functional props.
- Palette: cobalt/periwinkle, slate navy, pale sky, grass green, cream, wood and restrained amber.
- Avoid smooth vector illustration, painterly texture, glossy 3D, gradients, blur, and soft outlines.
- Each picture must teach one concrete relationship or action. Use props to explain, not unrelated decoration.
- Preserve the existing page controls, official AWS icons, captions, alt text and technical meaning. Do not generate brand logos inside the art.

## Reusable prompt

```text
Use case: [illustration-story | scientific-educational]
Asset type: [hero cutout | service chart | storyboard sheet]
Input image: STYLE REFERENCE ONLY, not an edit target.
Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
Scene: [one specific concept, characters, objects, and correct relationships].
Composition: [aspect ratio, whitespace, framing].
Text (verbatim): [only necessary labels, or "none"].
Constraints: [facts that must remain correct; no invented brand marks or data].
```

## Workflow

1. Inspect the reference and any local image being edited. Supply the reference using `referenced_image_paths`; name its role as style reference in the prompt.
2. Use the built-in Imagegen tool, one call per distinct asset. Do not use a CLI/API fallback without the user's request.
3. Request genuine alpha with `transparent_background: true` for hero cutouts. Use an opaque white diagram plate when dark labels need reliable contrast.
4. For sprite storyboards, specify exact canvas, rows, columns, cell sizes, reading order and consistent characters. Keep each scene inside its own cell.
5. Inspect the generated result for pixel technique, correct content, labels, arrows and exact grid alignment. Repair failures through Imagegen.
6. Keep the generated original. Save a versioned project copy. Convert to WebP, preserving alpha. Use nearest-neighbor when reducing pixel art at an integer ratio. Prefer lossless WebP when compact; use high-quality WebP if lossless exports become too large. This set uses quality 88, half-size charts/hero, and original-size storyboards to balance sharpness and page weight.
7. Set intrinsic dimensions and CSS `image-rendering: pixelated` on artwork only. Keep HTML text and official SVG logos normally rendered. Lazy-load below-the-fold images.
8. Save exact prompts, original paths, optimized paths, dimensions and bytes. Do not run tests/builds or browser validation unless the user asks.

## AWS asset set

The hero and all seven service charts share this style. The two situation sheets preserve the existing step order.

- Hero: transparent village, 3:2.
- Service charts: compute, database, networking, storage, monitoring, security, messaging; 3:2 white plates.
- Loading a page: 2 columns × 2 rows, 1536 × 1024, cells 768 × 512.
- Placing an order: 3 columns × 2 rows, 1536 × 1024, cells 512 × 512.
- For both sheets, CSS shows one frame at a time. No gutters, outside margins, or content crossing frame boundaries. Preserve the sheet aspect ratios when exporting.

## Exact generation prompts

### hero

- Tool mode: built-in Imagegen
- Transparent background: true

```text
Use case: illustration-story. Asset type: AWS learning guide hero, 3:2 landscape transparent cutout.
Input image: STYLE REFERENCE ONLY, not an edit target. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
Primary request: a tiny cloud-infrastructure village that teaches the online-shop metaphor. One coherent isometric tile island, viewed as 2D game sprites. A friendly brown-haired shopkeeper in a blue apron stands at a blue-awning shop counter. Around the small plaza are a worker's computer bench, a records cabinet, shelves of picture and document files, two blue task trays with envelope and parcel pictograms, a monitoring screen, and a small locked key cabinet. A shopper with a backpack approaches the counter. Make the objects easy to distinguish, with uncluttered breathing room and short tiled paths between zones. Cubical foliage at the edges only. Clear large silhouettes at small display sizes. No podium, trophy, score numbers, lettering, labels, speech bubbles, AWS logos, or watermark. Entire island and people visible with generous transparent margin, genuine alpha background, no sky rectangle and no checkerboard. Canvas 1536x1024.
```

### compute

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art illustrated service relationship chart, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background, two spacious horizontal lanes of little isometric tile platforms. Top lane from left to right: a shopper holding a request ticket, a blue server cabinet beside a worker, then a response parcel. Short clean cobalt pixel arrows point left to right between platforms. Top labels verbatim: "Request", "EC2", "Response". Bottom lane: an event ticket appears, a small worker at a laptop handles it, and a completed result parcel. Arrows left to right. Bottom labels verbatim: "Event", "Lambda", "Result". Use large readable dark navy pixel lettering. The two lanes are alternative ways to run code, so no arrow between lanes. No additional explanatory sentences, AWS logos, invented metrics, watermark, or decorative UI. Do not crop labels or sprites. Canvas 1536x1024.
```

### database

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art illustrated database comparison, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background, two spacious horizontal lanes of game sprite objects on isometric blue tile platforms. Upper lane: a clerk's board displays linked rows and columns of relational data, a compact blue database cabinet, and a filed order record. Large labels verbatim "SQL tables", "RDS", "Records", connected by left-to-right cobalt pixel arrows. Lower lane: a large key token, a keyed record cabinet with a clerk retrieving one drawer, and a cart record. Large labels verbatim "Key lookup", "DynamoDB", "Cart", connected by left-to-right cobalt pixel arrows. No arrow between the two lanes; they represent different storage approaches. Keep labels readable and all sprites within canvas. No additional text, AWS logos, fake numbers, watermark, or UI chrome. Canvas 1536x1024.
```

### networking

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art illustrated DNS and request-routing chart, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background. Top third is a small SEPARATE DNS exchange: a shopper laptop labeled "Browser", a two-way blue pixel arrow, a shopkeeper's address directory labeled "Route 53". Beside arrow label "DNS lookup". A clear horizontal whitespace separation below it. Lower two thirds is an HTTP request branching diagram: laptop "Browser" at left branches right to two alternative routes. Upper branch arrow "Assets" to blue delivery kiosk labeled "CloudFront", then arrow "Cache miss" to file shelves labeled "S3". Lower branch arrow "API request" to shop counter labeled "API Gateway", then arrow to worker desk labeled "App". Clear arrows, no crossings, aligned game tile stations. DNS must not be drawn as a serial proxy in the HTTP path. Large readable navy pixel lettering, sparse objects and labels. No AWS logos, extra text, fake metrics, or watermark. Canvas 1536x1024.
```

### storage

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art S3 object storage explainer, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background. On the left, three large game item sprites: a photo tile, a PDF document, and a zip archive box on three small tiled platforms. Labels verbatim "photo.jpg", "manual.pdf", "backup.zip". Blue pixel arrows lead into the right half: a friendly storage clerk beside spacious file shelves on a blue tile platform. Main large label "Amazon S3". A key-tag game item hangs beside one stored file, with label "Object key". Explain file-like objects being stored and retrieved by key, no database rows or hard disk hardware. Large readable dark navy labels, breathing room. No AWS logo, extra text, metric numbers, or watermark. Canvas 1536x1024.
```

### monitoring

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art CloudWatch monitoring explainer, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background. Left: little application worker at a laptop on a blue-tile platform labeled "App". Blue pixel arrow points to central monitoring desk labeled "CloudWatch". The desk has two clearly separate game-style monitors: one line chart labeled "Metrics", one stacked log slips panel labeled "Logs". The chart is illustrative, with no invented numerical readings. A blue arrow leads right to a large alarm bell sprite labeled "Alarm". Another small worker looks at the monitoring desk. Generously spaced, clear left-to-right information flow and large readable navy pixel labels. No AWS logos, extra text, fake uptime numbers, or watermark. Canvas 1536x1024.
```

### security

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art IAM and Secrets Manager permission diagram, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background. Left: backend worker with a computer on an isometric game tile platform labeled "Backend". Right: a locked blue credential cabinet and a key-token item on another platform labeled "Secrets Manager". A top blue pixel arrow points FROM Backend TO cabinet, label "Read secret". A bottom blue pixel arrow returns FROM cabinet TO Backend, label "Credential". Above the request path stands a small guard holding a permission checklist, label "IAM"; a short connector from the guard to the request indicates authorization, not a sequential network hop. Big clear labels and arrows, no customer sign-in form, no public exposed password text. No AWS logos, no extra explanatory prose, no watermark. Canvas 1536x1024.
```

### messaging

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: scientific-educational. Asset type: pixel-art SNS fan-out to SQS background workers chart, 3:2 landscape.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
White background, clear flow left to right with blue pixel arrows. Left: saved order ticket labeled "Order". Center-left: a dispatcher at a notice board labeled "SNS". From SNS split into two non-crossing branches to two separate blue task trays in center-right, EACH labeled "SQS". The top tray feeds a small laptop worker on a tiled platform, labeled "Email worker". The bottom tray feeds a parcel packer on a tiled platform, labeled "Shipping worker". Each queue has its own consumer. Do not connect the workers to each other. Present a real fan-out relationship, not a serial chain. Large readable dark navy pixel labels, generous space. No AWS logo, extra prose, fake counts, watermark, or UI chrome. Canvas 1536x1024.
```

### situation-page

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: illustration-story. Asset type: 2x2 sprite storyboard sheet consumed by CSS as FOUR individual frames.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
Canvas 1536x1024, EXACTLY 2 equal columns and 2 equal rows edge to edge, each frame 768x512, no outside margin, no gutters. Each frame has the same pale sky-white backdrop and a self-contained 2D pixel-art game scene, no content crossing frame boundaries. Center characters and objects inside their own panel, with comfortable internal padding. Same shopper (short dark hair, blue backpack) and shopkeeper (brown hair, blue apron) throughout. Top-left: shopper asks shopkeeper to look up the shop address in a large directory. Top-right: shopper requests a photo tile from a nearby blue-awning delivery kiosk. Bottom-left: storage worker fetches the original photo tile from file shelves. Bottom-right: shopper's laptop now shows the loaded shop product page with photo. All sprites, pixel tiles, trees, props and game-art technique match the reference. No text, numbers, logos, captions, arrows, panels drawn as in-game UI, or watermarks. The panel grid is a technical sprite sheet, not a comic with captions.
```

### situation-order

- Tool mode: built-in Imagegen
- Transparent background: false

```text
Use case: illustration-story. Asset type: 3x2 sprite storyboard sheet consumed by CSS as SIX individual frames.
Input image: STYLE REFERENCE ONLY. Style reference: the attached pixel-art game scene is the visual specification. Match its crisp, deliberately stepped pixel clusters, 2D isometric RPG sprite technique, chibi people with large square heads, tiny expressive dark eyes, dark contour clusters, square-cut hair, blue stone tiles, grass-topped platforms, cubical trees, and limited warm/cool shadow colors. Draw with flat sprite pixels, not smooth outlines or 3D rendering. Use chunky 2-3 pixel clusters at output resolution, restricted color ramps, hard pixel highlights and shadows. No anti-aliased vector curves, blur, smooth gradients, painterly texture, soft shading, photorealism, or glossy toy look. Palette: cobalt and periwinkle blue, slate navy outlines, pale sky, grass greens, cream, restrained wood brown and amber. Keep all subject relationships legible and generously spaced. Official AWS service logos are placed in HTML outside the artwork; do not invent or redraw AWS logos.
Canvas 1536x1024, EXACTLY 3 equal columns and 2 equal rows edge to edge, each frame 512x512, no outside margin, no gutters. Each frame is a self-contained small 2D pixel-art game scene on the same pale sky-white backdrop. All subjects comfortably inside their own frame, no content crosses boundaries. Consistent shopkeeper: brown hair, blue apron; shopper: dark hair, blue backpack. Reading order: top-left shopper submits an order ticket across a blue-awning shop counter; top-middle worker validates the ticket against a checklist at a laptop desk; top-right clerk files the confirmed ticket in a keyed record cabinet; bottom-left dispatcher announces the saved order on a notice board with a megaphone pictogram; bottom-middle two separate blue task trays, one envelope pictogram, one parcel pictogram; bottom-right two independent workers, one preparing an email on laptop and another packing a parcel. Small blue-tile platforms and restrained cubical foliage. No text, numbers, lettering, AWS logos, captions, arrows, or watermark. Exact equal grid is mandatory so each frame can be displayed separately.
```
