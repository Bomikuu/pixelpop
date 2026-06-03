import React, { useMemo, useState } from "react";
import { overlay } from "../ui/overlay";
import { RetroButton, RetroIconButton } from "../ui/retro";
import {
  Sparkles,
  Zap,
  BadgeCheck,
  AlertTriangle,
  XCircle,
  Loader,
  MousePointerClick,
  Volume2,
  Image as ImageIcon,
  Shuffle,
  MapPin,
  Trash2,
  Tv2,
} from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function OverlayPlayground() {
  const [loadingOn, setLoadingOn] = useState(false);
  const [fixedPos, setFixedPos] = useState("center"); // tl,tr,center,bl,br

  const FIXED = useMemo(() => {
    const map = {
      tl: { x: 18, y: 22 },
      tr: { x: 82, y: 22 },
      center: { x: 50, y: 50 },
      bl: { x: 18, y: 78 },
      br: { x: 82, y: 78 },
    };
    return map;
  }, []);

  const stickerPresets = useMemo(() => {
    return [
      { label: "Emoji 💖", payload: { emoji: "💖", entry: "zoomSpin", durationMs: 1100 } },
      { label: "Emoji 😂", payload: { emoji: "😂", entry: "shakePop", durationMs: 950 } },
      { label: "Text BRUH", payload: { text: "BRUH", entry: "flyLeft", size: 160, durationMs: 1300 } },
      { label: "Text OMG", payload: { text: "OMG!!", entry: "dropBounce", size: 180, durationMs: 1200 } },
      {
        label: "Image Blacky + Bruh",
        payload: {
          url: "/blacky.png",
          sfxUrl: "/bruh.mp3",
          sfxCooldownMs: 800,
          sfxVolume: 0.9,
          entry: "flyRight",
          size: 140,
          durationMs: 1400,
        },
      },
    ];
  }, []);

  const spawnRandomSticker = (base = {}) => {
    overlay.spawnSticker({
      ...base,
      x: rand(10, 90),
      y: rand(10, 90),
      rotate: rand(-18, 18),
      size: base.size ?? rand(42, 120),
      durationMs: base.durationMs ?? 1100,
    });
  };

  const spawnFixedSticker = (base = {}) => {
    const pos = FIXED[fixedPos] || FIXED.center;
    overlay.spawnSticker({
      ...base,
      x: pos.x,
      y: pos.y,
      rotate: base.rotate ?? rand(-10, 10),
      size: base.size ?? 96,
      durationMs: base.durationMs ?? 1100,
    });
  };

  const spawnBurst = (spec = {}) => {
    overlay.spawnBurst({
      x: rand(20, 80),
      y: rand(20, 80),
      count: Math.floor(rand(10, 22)),
      spread: rand(14, 28),
      entry: "zoomSpin",
      exit: "fade",
      durationMs: 950,
      ...spec,
    });
  };

  const burstBlacky = () => {
    spawnBurst({
      url: "/blacky.png",
      size: 74,
      count: Math.floor(rand(10, 18)),
      spread: rand(16, 30),
      entry: pick(["zoomSpin", "flyLeft", "flyRight", "dropBounce"]),
      exit: "fade",
      durationMs: 1050,
      sfxUrl: "/bruh.mp3",
      sfxCooldownMs: 900,
      sfxVolume: 0.9,
    });
  };

  const spawnRandomPreset = () => {
    const options = [
      { emoji: "✨", entry: "shakePop", size: 54, durationMs: 900 },
      { emoji: "🔥", entry: "zoomSpin", size: 58, durationMs: 980 },
      { emoji: "😂", entry: "dropBounce", size: 60, durationMs: 1000 },
      { text: "NOICE", entry: "flyTop", size: 160, durationMs: 1200 },
      { text: "BRUH", entry: "flyLeft", size: 170, durationMs: 1250 },
      {
        url: "/blacky.png",
        entry: "flyRight",
        size: 120,
        durationMs: 1250,
        sfxUrl: "/bruh.mp3",
        sfxCooldownMs: 800,
        sfxVolume: 0.9,
      },
    ];
    spawnRandomSticker(pick(options));
  };

  const soundOnly = () => {
    // "sound-only" trigger: spawn tiny invisible-ish sticker (no url/emoji/text)
    // but FloatingStickerLayer will still play sfxUrl with cooldown.
    overlay.spawnSticker({
      sfxUrl: "/bruh.mp3",
      sfxCooldownMs: 900,
      sfxVolume: 0.9,
      x: 50,
      y: 50,
      size: 18,
      durationMs: 180,
      entry: "floatUp",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Overlay Playground</h1>
        <p className="text-sm opacity-70">
          Test all overlay features (toast / modal / loading / effects / stickers / burst / sfx).
        </p>
      </div>

      {/* Target element for windowShake */}
      <div
        id="pp-test-window"
        className="rounded-xl border-2 border-dashed p-4 bg-white/60"
        style={{ borderColor: "rgba(0,0,0,0.25)" }}
      >
        <div className="font-semibold">Target Window</div>
        <div className="text-sm opacity-70">
          windowShake will shake this box (selector: <code>#pp-test-window</code>)
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <RetroButton
            variant="secondary"
            onClick={() => overlay.effect({ type: "windowShake", selector: "#pp-test-window", ms: 420, intensity: 7 })}
          >
            Window Shake
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "shake", ms: 420, intensity: 7 })}>
            Screen Shake
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "flash", ms: 160, opacity: 0.55 })}>
            Flash
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "glitch", ms: 520, strength: 9 })}>
            Glitch
          </RetroButton>
        </div>
      </div>

      {/* Toasts */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Toasts</h2>
        <div className="flex flex-wrap gap-2">
          <RetroButton onClick={() => overlay.toast({ type: "info", message: "Hello from toast!" })}>
            Info
          </RetroButton>
          <RetroButton onClick={() => overlay.toast({ type: "success", message: "Saved successfully!" })}>
            Success
          </RetroButton>
          <RetroButton onClick={() => overlay.toast({ type: "warning", message: "Careful now..." })}>
            Warning
          </RetroButton>
          <RetroButton variant="danger" onClick={() => overlay.toast({ type: "error", message: "Something went wrong." })}>
            Error
          </RetroButton>
        </div>
      </section>

      {/* Modals */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Modals</h2>
        <div className="flex flex-wrap gap-2">
          <RetroButton
            onClick={() =>
              overlay.showModal({
                title: "CONFIRM",
                subtitle: "Proceed with romance.exe?",
                content: <div className="font-bold">Are you sure?</div>,
                showDefaultActions: true,
                onConfirm: () => {
                  overlay.toast({ type: "success", message: "Confirmed!" });
                  overlay.effect({ type: "sfx", name: "success" });
                  overlay.effect({ type: "confetti", doubleBurst: true });
                },
              })
            }
          >
            Confirm Modal
          </RetroButton>

          <RetroButton
            variant="secondary"
            onClick={() =>
              overlay.showModal({
                title: "INFO",
                subtitle: "Overlay system online.",
                content: <div className="text-sm">This is a simple info modal.</div>,
                showDefaultActions: true,
                confirmText: "Nice",
                cancelText: "Close",
              })
            }
          >
            Info Modal
          </RetroButton>
        </div>
      </section>

      {/* Loading */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Loading</h2>
        <div className="flex flex-wrap gap-2">
          <RetroButton
            onClick={() => {
              setLoadingOn(true);
              overlay.showLoading({ title: "LOADING", subtitle: "Spawning confetti…" });
              overlay.effect({ type: "sfx", name: "beep" });
            }}
          >
            Show Loading
          </RetroButton>

          <RetroButton
            variant="secondary"
            onClick={() => {
              setLoadingOn(false);
              overlay.hideLoading();
              overlay.effect({ type: "sfx", name: "beep" });
            }}
            disabled={!loadingOn}
          >
            Hide Loading
          </RetroButton>
        </div>
      </section>

      {/* Effects */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Effects</h2>
        <div className="flex flex-wrap gap-2">
          <RetroButton onClick={() => overlay.effect({ type: "confetti", doubleBurst: true })}>
            Confetti
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "cursorTrail", ms: 1500 })}>
            Cursor Trail
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "crt", ms: 1200 })}>
            CRT (1.2s)
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "crt", toggle: true })}>
            CRT Toggle
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "vhs", ms: 900, strength: 12, aberration: 2, noise: 0.12 })}>
            VHS (0.9s)
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "vhs", toggle: true })}>
            VHS Toggle
          </RetroButton>
        </div>
      </section>

      {/* SFX */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sound (SFX)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <RetroIconButton
            title="Beep"
            icon={<Zap size={18} strokeWidth={3} />}
            onClick={() => overlay.effect({ type: "sfx", name: "beep", volume: 0.06 })}
          />
          <RetroIconButton
            title="Success"
            icon={<BadgeCheck size={18} strokeWidth={3} />}
            onClick={() => overlay.effect({ type: "sfx", name: "success", volume: 0.06 })}
          />
          <RetroIconButton
            title="Error"
            icon={<XCircle size={18} strokeWidth={3} />}
            onClick={() => overlay.effect({ type: "sfx", name: "error", volume: 0.07 })}
          />

          <RetroIconButton
            title="Audio Unlock Ping"
            icon={<MousePointerClick size={18} strokeWidth={3} />}
            onClick={() => {
              overlay.effect({ type: "sfx", name: "beep", volume: 0.01 });
              overlay.toast({ type: "info", message: "Audio unlock ping sent." });
            }}
          />

          <RetroIconButton
            title="Sound Only (bruh.mp3)"
            icon={<Volume2 size={18} strokeWidth={3} />}
            onClick={() => {
              soundOnly();
              overlay.toast({ type: "info", message: "Played custom mp3 (via sfxUrl cooldown)." });
            }}
          />
        </div>

        <p className="text-xs opacity-70">
          If audio doesn’t play until you click once, that’s normal browser behavior. Use “Audio Unlock Ping”.
        </p>
      </section>

      {/* Stickers */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stickers</h2>

        {/* Fixed position controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="text-sm font-semibold opacity-80 flex items-center gap-2">
            <MapPin size={16} /> Fixed Position:
          </div>

          <RetroButton variant={fixedPos === "tl" ? "secondary" : "ghost"} onClick={() => setFixedPos("tl")}>
            TL
          </RetroButton>
          <RetroButton variant={fixedPos === "tr" ? "secondary" : "ghost"} onClick={() => setFixedPos("tr")}>
            TR
          </RetroButton>
          <RetroButton variant={fixedPos === "center" ? "secondary" : "ghost"} onClick={() => setFixedPos("center")}>
            Center
          </RetroButton>
          <RetroButton variant={fixedPos === "bl" ? "secondary" : "ghost"} onClick={() => setFixedPos("bl")}>
            BL
          </RetroButton>
          <RetroButton variant={fixedPos === "br" ? "secondary" : "ghost"} onClick={() => setFixedPos("br")}>
            BR
          </RetroButton>

          <RetroButton
            variant="secondary"
            onClick={() => {
              spawnFixedSticker({
                url: "/blacky.png",
                entry: "dropBounce",
                size: 140,
                durationMs: 1400,
                sfxUrl: "/bruh.mp3",
                sfxCooldownMs: 900,
                sfxVolume: 0.9,
              });
            }}
          >
            Spawn Blacky (Fixed)
          </RetroButton>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {stickerPresets.map((p) => (
            <RetroButton
              key={p.label}
              variant="secondary"
              onClick={() => {
                spawnRandomSticker(p.payload);
              }}
            >
              {p.label}
            </RetroButton>
          ))}

          <RetroButton variant="ghost" onClick={() => overlay.clearStickers()}>
            <span className="inline-flex items-center gap-2">
              <Trash2 size={16} /> Clear
            </span>
          </RetroButton>

          <RetroButton
            onClick={() => {
              spawnRandomPreset();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Shuffle size={16} /> Random Sticker
            </span>
          </RetroButton>
        </div>

        {/* Bursts */}
        <div className="flex flex-wrap gap-2">
          <RetroButton variant="secondary" onClick={() => spawnBurst({ emoji: "✨" })}>
            Burst ✨
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => spawnBurst({ emoji: "🔥" })}>
            Burst 🔥
          </RetroButton>
          <RetroButton variant="secondary" onClick={() => spawnBurst({ emoji: "💖" })}>
            Burst 💖
          </RetroButton>

          <RetroButton
            onClick={() => {
              burstBlacky();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <ImageIcon size={16} /> Burst Blacky + Bruh
            </span>
          </RetroButton>
        </div>

        {/* Tap area */}
        <div className="rounded-xl border p-4 bg-white/60">
          <div className="font-semibold">Tap Area</div>
          <div className="text-sm opacity-70">Click anywhere here to spawn a sticker at the click position.</div>

          <div
            className="mt-3 h-48 rounded-xl border bg-white/70 relative overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;

              overlay.spawnSticker({
                emoji: "✨",
                x,
                y,
                entry: "shakePop",
                size: 44,
                durationMs: 900,
              });

              overlay.effect({ type: "sfx", name: "beep", volume: 0.05 });
            }}
          />
        </div>

        <p className="text-xs opacity-70">
          Assets expected: <code>/blacky.png</code> and <code>/bruh.mp3</code> (place them in <code>public/</code>).
        </p>
      </section>

      {/* Combos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Combos</h2>
        <div className="flex flex-wrap gap-2">
          <RetroButton
            onClick={() => {
              overlay.toast({ type: "success", message: "Saved successfully!" });
              overlay.effect({ type: "sfx", name: "success", volume: 0.06 });
              overlay.effect({ type: "confetti", doubleBurst: true });
            }}
          >
            Success Combo
          </RetroButton>

          <RetroButton
            variant="danger"
            onClick={() => {
              overlay.effect({ type: "shake", ms: 420, intensity: 7 });
              overlay.effect({ type: "flash", ms: 140, opacity: 0.55 });
              overlay.effect({ type: "sfx", name: "error", volume: 0.07 });
              overlay.toast({ type: "error", message: "Something went wrong." });
            }}
          >
            Error Combo
          </RetroButton>

          <RetroButton
            variant="secondary"
            onClick={() => {
              overlay.spawnSticker({
                text: "ROMANCE.EXE",
                x: 50,
                y: 45,
                size: 220,
                entry: "zoomSpin",
                durationMs: 1200,
              });
              overlay.effect({ type: "vhs", ms: 650, strength: 14, aberration: 3, noise: 0.14 });
              overlay.effect({ type: "sfx", name: "beep", baseFreq: 220, durationMs: 70, volume: 0.06 });
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Tv2 size={16} /> VHS Sticker Hit
            </span>
          </RetroButton>
        </div>
      </section>
    </div>
  );
}
