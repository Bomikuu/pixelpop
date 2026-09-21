# PixelPopup Design Guidelines

## Design identity

PixelPopup should feel like a lovingly handcrafted internet artifact: part early personal homepage, part desktop operating system, part interactive greeting card.

The default visual direction is **retro web nostalgia**, not strict pixel art. Components should feel playful, tactile, slightly imperfect, and made for a specific person or occasion.

The design should communicate:

- personal rather than corporate
- interactive rather than static
- nostalgic rather than outdated
- expressive rather than visually chaotic
- handcrafted rather than generic

## Default visual language

### Shape and depth

- Prefer visible 2-3px borders.
- Use offset, hard-edged shadows rather than soft material-design shadows.
- Use rounded corners selectively. Window panels and cards can be rounded, but avoid making every element a pill.
- Buttons should look pressable and should visibly move or change shadow on interaction.
- Use layered panels, title bars, badges, stickers, and small decorative elements to create depth.

Existing design tokens live in `pixelpopup-frontend/src/index.css`:

```css
--pp-border
--pp-shadow
--pp-shadow-soft
--pp-accent
--pp-accent-2
--pp-titlebar
--pp-titlebar-2
--pp-window
--pp-font
```

Use these variables or component-level theme variables before inventing new colors.

### Color

The default PixelPopup palette is high-contrast and playful:

- deep purple or blue backgrounds
- near-black borders
- bright cyan, hot pink, yellow, or lime accents
- pale window/card surfaces
- occasional gradients, grids, or rainbow details

Use one dominant accent and one supporting accent per experience. Do not give every element a different saturated color.

For occasion-specific themes, keep the structure and interaction language consistent while changing the palette. A wedding can be elegant; a date planner can be soft and pastel; a game can be loud and arcade-like.

## Component rules

Before creating a new component, decide whether it is:

1. a reusable primitive,
2. a reusable scene/panel,
3. an experience-specific component, or
4. a decorative/effects component.

Place it accordingly:

- `src/ui/retro/` - reusable visual primitives and panels
- `src/ui/overlay/` - global modals, toasts, loading states, effects, stickers, and sound
- `src/ui/scenes/` - reusable or occasion-specific scene components
- `src/features/<feature>/` - feature orchestration and feature-specific components
- `src/pages/` - route-level composition only

### Reusable primitives

Reusable components should:

- have a clear visual role and a small prop surface
- expose content and labels through props
- avoid hard-coding one person's name, occasion, or story
- use the existing retro tokens
- support keyboard focus and disabled states
- provide sensible defaults
- avoid owning global state unless they are explicitly a global host

Good primitives include windows, panels, buttons, badges, inputs, choice cards, timeline cards, map cards, and modal shells.

### Scene components

Scene components should feel like complete moments in an experience. They may be more expressive than primitives, but should still:

- accept content through props/config
- communicate user actions through callbacks such as `onPrimary`, `onBack`, `onChoose`, or `onDone`
- avoid directly deciding the next scene
- use the overlay bus for global effects
- work inside `SceneEngine` when appropriate
- have an obvious empty/loading/error state when external content is involved

The scene should render the moment; the flow/runtime should decide what happens next.

### Page components

Page components should compose features and routes. Keep them thin. Avoid placing large reusable visual blocks or flow logic directly in `App.jsx` or route files.

## Interaction and motion

Motion is part of PixelPopup's personality, but it should make an action feel meaningful rather than slow the user down.

Preferred motion:

- small hover lifts
- button press/compression
- springy modal entry
- typewriter text for special messages
- sticker pop-ins and gentle floating decorations
- scene transitions with a clear direction
- confetti, flash, shake, or sound after important moments

Avoid:

- constant movement behind readable content
- animations longer than necessary for routine actions
- effects that obscure buttons or form fields
- relying on color or motion alone to communicate state
- forcing sound on page load

Always consider `prefers-reduced-motion`. Important content and actions must remain understandable without animation.

Global effects should go through `src/ui/overlay/overlayBus.js` rather than being implemented as unrelated window events or duplicated overlay systems.

## Typography and content

- Use the retro monospace style for labels, controls, metadata, and UI chrome.
- Use a more readable proportional face for longer emotional copy when appropriate.
- Keep headings short and characterful.
- Prefer sentence case for explanatory text and uppercase sparingly for labels/title bars.
- Make the emotional message the hero. Decorative UI should support it, not compete with it.
- Avoid generic SaaS language such as “Submit,” “Continue workflow,” or “Manage experience” in recipient-facing experiences. Prefer human language such as “Yes,” “View details,” “Open the letter,” or “Plan the date.”

## Layout and responsive behavior

- Design mobile-first because many experiences will be opened from a shared link on a phone.
- Keep primary actions reachable without precise pointing.
- Do not make retro decoration consume the first screenful of content.
- Use a strong vertical reading order on small screens.
- Allow panels, maps, galleries, and timelines to collapse into a usable single-column mode.
- Keep tap targets comfortably large even when the surrounding style is pixel-like.
- Use full-viewport effects carefully; they must not interfere with scrolling or interaction.

## Theme architecture

PixelPopup should support multiple skins built on shared primitives.

The shared layer should define:

- spacing and layout behavior
- border and shadow behavior
- button interaction states
- focus states
- modal/toast/loading behavior
- transition conventions
- overlay/effect APIs

An experience theme may define:

- palette
- typography pairing
- background treatment
- title-bar style
- decorative assets
- default motion intensity
- sound/effect vocabulary

The backend fields `Page.theme_id`, `Page.theme_settings`, and scene theme overrides are intended to support this separation. New theme-specific behavior should be configurable where possible instead of branching throughout shared components.

## Accessibility baseline

Retro styling must not reduce usability.

Every interactive component should have:

- a semantic HTML element where possible
- an accessible name
- visible keyboard focus
- a disabled/loading state when relevant
- sufficient text/background contrast
- a non-motion or reduced-motion equivalent
- error text that is not conveyed by color alone

Decorative stickers, background effects, and audio should be hidden from assistive technology when they do not convey meaning. Do not use emoji as the only label for an important action.

## Performance baseline

- Prefer CSS for simple decoration and transitions.
- Lazy-load large scenes, maps, videos, and unusual effects when they are not needed immediately.
- Avoid shipping every demo or occasion asset on the first public page load.
- Compress or appropriately size images and video.
- Do not add a dependency for a visual effect that can be implemented with the existing UI/effects layer.
- Check mobile performance when adding canvas, video, Mapbox, confetti, or continuous animation.

## Code style for new components

### Styling policy

Tailwind CSS is the default styling approach for PixelPopup components. Use Tailwind utility classes for:

- layout, spacing, sizing, alignment, and responsive behavior
- typography, borders, colors, shadows, and common states
- simple hover, focus, active, and disabled states
- one-off composition that does not need a reusable selector

Custom CSS classes are allowed when Tailwind would make the code less clear or cannot express the behavior cleanly, especially for:

- pseudo-elements and layered visual effects
- keyframes and timing-heavy animations
- scanlines, CRT/VHS treatment, gradients, texture, and image-rendering rules
- complicated responsive visual compositions
- third-party library overrides
- a repeated visual pattern that deserves a named semantic class

When custom CSS is needed, keep it local to the feature where possible, give the class a meaningful name, and avoid recreating standard Tailwind utilities in CSS. A component should make it obvious which styling is ordinary layout and which styling is PixelPopup-specific art direction.

Use this general shape:

```jsx
export default function RetroExampleCard({
  title,
  description,
  primaryText = "Open",
  onPrimary,
  disabled = false,
}) {
  return (
    <section className="...">
      <h2 className="...">{title}</h2>
      <p className="...">{description}</p>
      <button type="button" disabled={disabled} onClick={onPrimary}>
        {primaryText}
      </button>
    </section>
  );
}
```

Prefer:

- explicit prop names
- callback props for actions
- config-driven text and media
- small helper functions outside render
- shared classes/tokens for repeated visual patterns
- predictable component states

Avoid:

- hard-coded personal content in reusable UI
- direct navigation from low-level components
- defining component functions inside another component's render body
- random values during render; generate them in an event/effect or memoized initialization
- empty `catch {}` blocks without a comment or fallback behavior
- new one-off global event channels

## Component checklist

Before considering a component finished, check:

- Does it look like PixelPopup, even without extra decoration?
- Does it use the existing border/shadow/color tokens?
- Is its visual role clear?
- Is content configurable rather than hard-coded?
- Does it work on a narrow mobile viewport?
- Can it be used with keyboard and reduced motion?
- Are hover, focus, pressed, disabled, loading, and empty states handled?
- Does it use the overlay bus for global effects?
- Does it belong in `ui`, `scenes`, `features`, or `pages` correctly?
- Does `npm run build` still pass?
- Does the new code avoid adding to the existing lint debt?

## Final design rule

PixelPopup should feel like a tiny world made for one person. Every border, sticker, sound, transition, and interaction should reinforce that feeling. If an effect is visually impressive but makes the message harder to read or the action harder to understand, simplify the effect.
