# Roaming cat mascot

The mascot is enabled only on the portfolio and ASTA routes. Behavior, timing,
safe-zone selectors, responsive dimensions, and the asset URL live in
`catMascotConfig.js`; route-aware copy lives in
`src/data/cat-mascot-messages.json`.

The current transparent PNG is a 1536×1024 sheet arranged as four columns by
two rows. Replacement sheets should preserve that grid or update both the
sprite metadata and the `background-position` states in `catMascot.css`.

Use `data-mascot-exclusion-zone` on new fixed controls or high-priority content
that the cat should avoid. Native open dialogs, navigation, forms, portfolio
CTAs, and ASTA project buttons are already covered by the default selectors.
