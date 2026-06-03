# Overlay Effects & Stickers (PixelPopup.exe)

This project has a **global Overlay system** that can show:

- ✅ Toasts
- ✅ Modals
- ✅ Loading screens
- ✅ Screen / window effects (CRT, VHS, shake, glitch, confetti, cursor trail)
- ✅ Stickers (emoji / images / text) that fly in, zoom, spin, and fade out
- ✅ Sound effects (beep / success / error)

All of these are triggered from **any component** by calling `overlay.*(...)`.

---

## Quick Setup

1. Render the host once (usually in `App.jsx` or your root layout):

```jsx
import OverlayHost from './overlay/OverlayHost';

export default function App() {
  return (
    <>
      <OverlayHost />
      {/* routes/pages */}
    </>
  );
}
```

2. Make sure these files are consistent:

- `src/overlay/overlayBus.js` exports `{ overlay, subscribeOverlay, EVT }`
- `src/overlay/OverlayHost.jsx` subscribes to `subscribeOverlay`
- `src/overlay/EffectsHost.jsx` renders `<FloatingStickerLayer />`
- `src/retro/effects/FloatingStickerLayer.jsx` listens to bus events (`EVT.STICKER_*`)

> **Important:** Avoid importing overlayBus using different paths (can create 2 buses). Pick one import style and use it everywhere.

---

## How to Trigger Everything

Import the overlay bus:

```js
import { overlay } from '../overlay/overlayBus';
```

(Adjust the path based on where your component lives.)

---

# Toasts

### Basic

```js
overlay.toast({ type: 'success', message: 'Saved successfully!' });
```

### Options

```js
overlay.toast({
  type: 'info' | 'success' | 'error' | 'warning',
  title: 'Optional title',
  message: 'Text message',
  durationMs: 2800, // optional override
});
```

---

# Modals

```js
overlay.showModal({
  title: 'CONFIRM',
  subtitle: 'Proceed with romance.exe?',
  content: <div className='font-pp font-extrabold'>Are you sure?</div>,
  showDefaultActions: true,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onConfirm: () => overlay.toast({ type: 'info', message: 'Confirmed!' }),
});
```

### Close a modal

If you passed an `id`:

```js
overlay.showModal({ id: 'confirm1', title: '...' });
// later
overlay.hideModal('confirm1');
```

---

# Loading

```js
overlay.showLoading({
  title: 'LOADING',
  subtitle: 'Spawning confetti…',
});

// later
overlay.hideLoading();
```

---

# Effects (Screen + Window + SFX)

Trigger any effect using:

```js
overlay.effect({ type: '...', ...options });
```

## 1) Confetti

```js
overlay.effect({ type: 'confetti' });
```

Advanced:

```js
overlay.effect({
  type: 'confetti',
  particleCount: 160,
  spread: 80,
  startVelocity: 35,
  decay: 0.9,
  scalar: 1,
  origin: { x: 0.5, y: 0.55 },
  doubleBurst: true,
});
```

---

## 2) Screen Shake

```js
overlay.effect({ type: 'shake', ms: 420, intensity: 6 });
```

---

## 3) Flash

```js
overlay.effect({ type: 'flash', ms: 180, opacity: 0.65 });
```

---

## 4) Glitch

```js
overlay.effect({ type: 'glitch', ms: 520, strength: 8 });
```

---

## 5) Cursor Trail

```js
overlay.effect({ type: 'cursorTrail', ms: 1500 });
```

---

## 6) CRT Scanlines (toggle or timed)

Toggle:

```js
overlay.effect({ type: 'crt', toggle: true });
```

Timed:

```js
overlay.effect({ type: 'crt', ms: 1200 });
```

Force on/off:

```js
overlay.effect({ type: 'crt', on: true });
overlay.effect({ type: 'crt', on: false });
```

---

## 7) VHS Jitter + Chromatic Aberration

Timed:

```js
overlay.effect({
  type: 'vhs',
  ms: 900,
  strength: 12,
  aberration: 2,
  noise: 0.12,
});
```

Toggle:

```js
overlay.effect({ type: 'vhs', toggle: true });
```

---

## 8) Window Shake (shake only a specific window/panel)

This shakes a **specific element** by CSS selector.

```js
overlay.effect({
  type: 'windowShake',
  selector: '#myWindow',
  ms: 420,
  intensity: 6,
});
```

> Tip: Give your `Window` wrapper an `id`.

---

## 9) Sound Effects (SFX)

You can trigger sounds via:

```js
overlay.effect({ type: 'sfx', name: 'beep' });
```

Supported names:

- `"beep"` (default)
- `"success"`
- `"error"`

Advanced:

```js
overlay.effect({
  type: 'sfx',
  name: 'beep',
  volume: 0.05, // 0..1
  baseFreq: 880,
  durationMs: 35,
});
```

⚠️ Browser note: WebAudio can require a user gesture first.

If sounds don’t play, do a one-time "unlock" on click:

```js
window.addEventListener(
  'pointerdown',
  () => {
    overlay.effect({ type: 'sfx', name: 'beep', volume: 0.01 });
  },
  { once: true },
);
```

---

# Stickers (Emoji / Image / Text)

Stickers are rendered globally by `FloatingStickerLayer`.

Trigger a sticker:

```js
overlay.spawnSticker({ emoji: '💖' });
```

## Sticker fields

```js
overlay.spawnSticker({
  // Content (choose one)
  emoji: '😂',
  // url: "/memes/bruh.png",
  // text: "BRUH",

  // Placement (percent)
  x: 50,
  y: 50,

  // Size + rotation
  size: 72, // px
  rotate: 0,

  // Animation
  entry: 'zoomSpin',
  exit: 'fade',
  durationMs: 1100,

  // Optional
  clickable: false,
  onClick: (sticker) => console.log('clicked', sticker),

  // Optional effect hooks
  effects: [{ type: 'vhs', ms: 400 }],

  // Optional sound shortcut (or use overlay.effect)
  sfx: 'beep',
});
```

## Entry animations (supported)

- `floatUp`
- `flyLeft`
- `flyRight`
- `flyTop`
- `flyBottom`
- `zoomSpin`
- `dropBounce`
- `shakePop`

## Exit animations (supported)

- `fade`

(You can add more exits later by adding keyframes in `FloatingStickerLayer`.)

---

## Sticker Burst (spawn many at once)

```js
overlay.spawnBurst({
  emoji: '🔥',
  x: 50,
  y: 50,
  count: 18,
  spread: 22,
  entry: 'zoomSpin',
  exit: 'fade',
  durationMs: 950,
});
```

---

## Clear all stickers

```js
overlay.clearStickers();
```

---

# Common Recipes

## Success combo (toast + confetti + success sound)

```js
overlay.toast({ type: 'success', message: 'Saved successfully!' });
overlay.effect({ type: 'sfx', name: 'success' });
overlay.effect({ type: 'confetti', doubleBurst: true });
```

## Error combo (shake + flash + error sound)

```js
overlay.effect({ type: 'shake', ms: 420, intensity: 7 });
overlay.effect({ type: 'flash', ms: 140, opacity: 0.55 });
overlay.effect({ type: 'sfx', name: 'error', volume: 0.07 });
overlay.toast({ type: 'error', message: 'Something went wrong' });
```

## Meme sticker + VHS hit

```js
overlay.spawnSticker({
  url: '/memes/bruh.png',
  x: 60,
  y: 40,
  size: 140,
  entry: 'flyLeft',
  durationMs: 1400,
});
overlay.effect({ type: 'vhs', ms: 650, strength: 14, aberration: 3 });
overlay.effect({ type: 'sfx', name: 'beep', baseFreq: 220, durationMs: 70 });
```

---

# Notes / Troubleshooting

### Stickers don’t show

- Ensure `<OverlayHost />` is rendered once at the root.
- Ensure `FloatingStickerLayer` listens to the **bus** events (`EVT.STICKER_*`).
- Ensure you don’t import `overlayBus.js` using multiple different paths (can create duplicate singletons).

### Sounds don’t play

- WebAudio usually requires a user gesture.
- Use the “unlock” snippet shown above.

---

# Next Planned Effects

- Emoji / image “fly” presets with cooldown + max spawns (already partly supported)
- More exit patterns (flyOutTop/Left/Right/etc)
- SceneEngine + BranchingFlow after components are finished
