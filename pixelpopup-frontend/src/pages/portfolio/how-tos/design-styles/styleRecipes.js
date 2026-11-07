export const styleCategories = [
  { id: "all", title: "All styles" },
  { id: "surfaces", title: "Surfaces & materials" },
  { id: "structure", title: "Layout & typography" },
  { id: "worlds", title: "Visual worlds" },
];

export const styleRecipes = {
  "claymorphism": {
    "category": "surfaces",
    "traits": [
      "Inflated, cushion-like forms",
      "Rounded edges with inset highlights",
      "Soft shadows that separate layers"
    ],
    "palette": "Pastel periwinkle, peach, mint and warm white",
    "recipe": "soft inflated clay shapes, gently rounded geometry, matte plasticine surfaces, inset highlights and layered soft shadows",
    "avoid": "hard offset shadows, thin glass edges, overly puffy text or illegible controls"
  },
  "neo-brutalism": {
    "category": "worlds",
    "traits": [
      "Visible heavy outlines",
      "Hard offset shadows",
      "Flat, bold color blocks"
    ],
    "palette": "Warm yellow, cobalt, coral, black and cream",
    "recipe": "heavy black outlines, bold flat color blocks, hard offset shadows, oversized direct typography and deliberately exposed structure",
    "avoid": "soft blur, low-contrast decoration, too many equally dominant actions"
  },
  "glassmorphism": {
    "category": "surfaces",
    "traits": [
      "Translucent layered panels",
      "A backdrop visible through the surface",
      "Fine light edges and restrained blur"
    ],
    "palette": "Cool blue, violet, ice white and deep navy",
    "recipe": "frosted translucent panels, visible backdrop depth, fine luminous edges and restrained background blur with readable foreground content",
    "avoid": "transparent text, weak contrast, excessive glow, blur without a solid-surface fallback"
  },
  "neumorphism": {
    "category": "surfaces",
    "traits": [
      "Controls match the surrounding surface",
      "Paired light and dark soft shadows",
      "Raised and inset states"
    ],
    "palette": "Warm pale gray, slate and one restrained blue accent",
    "recipe": "a monochrome surface with paired highlight and shadow, subtle raised and inset controls, explicit borders and clear active states",
    "avoid": "colorful floating cards, invisible controls, relying on shadows alone for state"
  },
  "bento-grid": {
    "category": "structure",
    "traits": [
      "A modular grid of related compartments",
      "Unequal tile sizes show priority",
      "A clear reading order across the tiles"
    ],
    "palette": "White, slate, cobalt and a small green accent",
    "recipe": "an aligned modular grid with intentionally unequal tile sizes, related content grouped together and a logical mobile reading order",
    "avoid": "arbitrary tile sizes, repeated filler tiles, decorative gaps, broken reading order"
  },
  "swiss-design": {
    "category": "structure",
    "traits": [
      "A precise alignment grid",
      "Strong typographic hierarchy",
      "Restrained, asymmetrical composition"
    ],
    "palette": "Paper white, black and a single red accent",
    "recipe": "a precise modular grid, asymmetric composition, clear sans-serif typography, rigorous alignment and a restrained palette",
    "avoid": "random centering, ornamental textures, decorative type without hierarchy"
  },
  "minimalism": {
    "category": "structure",
    "traits": [
      "A small set of necessary elements",
      "Generous, deliberate negative space",
      "One clear focal action"
    ],
    "palette": "Off-white, charcoal and a quiet cobalt accent",
    "recipe": "a minimal set of meaningful elements, generous negative space, clear hierarchy and one obvious primary action",
    "avoid": "removing useful explanations, hidden navigation, tiny low-contrast labels"
  },
  "y2k": {
    "category": "worlds",
    "traits": [
      "Chrome or glossy digital surfaces",
      "Playful early-web shapes and symbols",
      "Expressive display lettering"
    ],
    "palette": "Chrome silver, icy blue, bubblegum pink and white",
    "recipe": "turn-of-the-millennium digital styling with chrome display accents, glossy plastic, playful orbit motifs and expressive but readable composition",
    "avoid": "chrome body text, cluttered navigation, synthwave sunset clichés"
  },
  "synthwave": {
    "category": "worlds",
    "traits": [
      "A dark retro-futurist field",
      "Neon accents and luminous horizons",
      "1980s-inspired electronic imagery"
    ],
    "palette": "Deep navy, magenta, electric cyan and violet",
    "recipe": "a dark retro-futurist scene, controlled neon accents, a luminous horizon and restrained 1980s electronic imagery",
    "avoid": "glow around body text, continuous distracting motion, illegible dark-on-dark controls"
  },
  "pixel-art": {
    "category": "worlds",
    "traits": [
      "Deliberately visible pixel clusters",
      "Limited color ramps and sprite silhouettes",
      "Crisp scaling with readable HTML alongside"
    ],
    "palette": "Periwinkle, cobalt, grass green, cream and navy",
    "recipe": "crisp 2D game sprites, stepped pixel clusters, a limited palette, isometric tile platforms and expressive chibi characters",
    "avoid": "smoothed or blurred sprite edges, tiny pixel-font body copy, inconsistent pixel sizes"
  },
  "editorial": {
    "category": "structure",
    "traits": [
      "An expressive headline leads the story",
      "Images and captions establish rhythm",
      "Columns follow a deliberate reading order"
    ],
    "palette": "Warm paper, ink black and a restrained blue accent",
    "recipe": "a magazine-inspired composition with expressive headlines, purposeful image crops, captions, readable columns and clear reading rhythm",
    "avoid": "scattered columns without reading order, decorative captions, unreadable text over photography"
  },
  "luxury-typography": {
    "category": "structure",
    "traits": [
      "Display lettering carries the identity",
      "Careful spacing and restrained composition",
      "Few competing accents"
    ],
    "palette": "Ivory, ink black and a quiet slate accent",
    "recipe": "carefully spaced display typography, restrained composition, few competing elements and readable supporting text",
    "avoid": "illegibly thin text, tiny labels, automatic gold-and-marble clichés"
  },
  "scrapbook": {
    "category": "worlds",
    "traits": [
      "Layered paper and cutout imagery",
      "Personal annotations and tactile texture",
      "Decorative overlap around readable content"
    ],
    "palette": "Cream paper, denim blue, warm brown and muted coral",
    "recipe": "layered cutouts, paper texture, small handwritten annotations and tactile collage details around a clear reading order",
    "avoid": "overlap obscuring content, every element rotated, illegible handwriting for body copy"
  },
  "terminal": {
    "category": "worlds",
    "traits": [
      "Monospaced type and command-line cues",
      "A restrained screen-like palette",
      "Explicit, discoverable actions"
    ],
    "palette": "Near-black, soft mint and muted gray",
    "recipe": "a restrained terminal-inspired interface with monospaced labels, command-line cues, clear focus and visible actions that need no command knowledge",
    "avoid": "requiring typed commands to navigate, decorative code walls, low-contrast tiny output"
  }
};

export const styleImagePath = (slug) => `/portfolio/assets/how-tos/design-styles/${slug}-v1.webp`;

export function buildStylePrompt({ style, recipe, mode, subject, audience, palette, action }) {
  const project = subject.trim() || "an interactive learning workspace";
  const reader = audience.trim() || "people learning a new skill";
  const colors = palette.trim() || recipe.palette;
  const primaryAction = action.trim() || "Continue lesson";

  if (mode === "illustration") return `Use case: illustration-story.
Create an illustration of ${project} for ${reader}.
Visual style: ${style.title}.
Describe the style through these choices: ${recipe.recipe}.
Color palette: ${colors}.
Composition: one clear focal subject, supporting objects that explain its purpose, and enough space around the edges for a 3:2 landscape crop.
Text: use no lettering unless needed; if an action label appears, use exactly "${primaryAction}".
Avoid: ${recipe.avoid}. Do not invent logos, testimonials, metrics or watermarks.
Quality check: the image should still communicate its subject at a small preview size. If I attach a reference, use it for style unless I explicitly name it as an edit target.
Output: a standalone illustration. If a transparent cutout is needed, request genuine alpha separately.`;

  return `Design ${project} for ${reader}.
Design direction: ${style.title}.
Make the style concrete: ${recipe.recipe}.
Color palette: ${colors}.
Primary action: "${primaryAction}". Make it easy to find and distinguish from secondary actions.
Content and layout: organize the real content into a clear hierarchy, keep useful explanations, and define the reading order before adding decoration. Ask about missing product requirements instead of inventing them.
Interaction: include hover, keyboard focus, selected, disabled, loading, empty and error states where relevant.
Accessibility and responsive behavior: readable body type, sufficient contrast, semantic controls, comfortable touch targets, a clear mobile layout and reduced-motion alternatives.
Watch out: ${style.caution}
Avoid: ${recipe.avoid}. Do not invent customer claims, metrics or brand assets.
If this is an existing product, preserve its routes, functionality and confirmed brand constraints. Treat this direction as a starting brief and explain any conflict before replacing the visual identity.`;
}

