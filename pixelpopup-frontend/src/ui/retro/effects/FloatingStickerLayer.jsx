// src/retro/effects/FloatingStickerLayer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { clamp, uid } from "./stickerEngine";
import { subscribeOverlay, EVT, overlay } from "../../overlay/overlayBus";

export default function FloatingStickerLayer({
  zIndex = 9999,
  maxActive = 40, // safety limit
}) {
  const [items, setItems] = useState([]);

  // ---- SFX URL cooldown + shared audio ----
  const audioRef = useRef(null);
  const lastPlayedAtRef = useRef(new Map()); // key: url, value: ms timestamp

  const canPlayUrl = (url, cooldownMs) => {
    if (!url) return false;
    const now = Date.now();
    const last = lastPlayedAtRef.current.get(url) || 0;
    if (now - last < cooldownMs) return false;
    lastPlayedAtRef.current.set(url, now);
    return true;
  };

  const playSfxUrl = (url, volume = 0.85) => {
    if (!url) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = "auto";
      }
      const a = audioRef.current;

      a.pause();
      a.currentTime = 0;
      a.src = url;
      a.volume = Math.max(0, Math.min(1, volume));

      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      // ignore
    }
  };

  const pushItem = (item) => {
    setItems((prev) => {
      const next = [...prev, item];
      if (next.length > maxActive) return next.slice(next.length - maxActive);
      return next;
    });

    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x._runtimeId !== item._runtimeId));
    }, Math.max(180, item.durationMs || 1000));
  };

  useEffect(() => {
    return subscribeOverlay((evt) => {
      if (!evt) return;

      // ---- SPAWN 1 ----
      if (evt.type === EVT.STICKER_SPAWN) {
        const p = evt.payload || {};
        const entry = p.entry || p.anim || "floatUp";
        const exit = p.exit || "fade";

        const it = {
          _runtimeId: uid(),
          _bornAt: Date.now(),

          // content
          url: p.url,
          emoji: p.emoji,
          text: p.text,

          // placement
          x: clamp(p.x ?? 50, 0, 100),
          y: clamp(p.y ?? 50, 0, 100),
          size: clamp(p.size ?? 64, 18, 280),
          rotate: Number(p.rotate ?? 0),

          // anim
          entry,
          exit,
          durationMs: Number(p.durationMs ?? 1100),

          // click + extras
          clickable: Boolean(p.clickable),
          onClick: p.onClick,
          effects: p.effects || [],

          // existing "named" sfx (WebAudio beep/success/error)
          sfx: p.sfx,

          // NEW: custom audio url (mp3)
          sfxUrl: p.sfxUrl,
          sfxVolume: p.sfxVolume,
          sfxCooldownMs: p.sfxCooldownMs,
        };

        // Optional named SFX (EffectsHost WebAudio)
        if (it.sfx) {
          overlay.effect({ type: "sfx", name: it.sfx, volume: p.sfxVolume ?? 0.06 });
        }

        // NEW: Optional custom SFX URL (HTMLAudio) with cooldown
        if (it.sfxUrl) {
          const cd = Math.max(0, Number(it.sfxCooldownMs ?? 700)); // default 700ms
          const vol = it.sfxVolume ?? 0.85;

          if (canPlayUrl(it.sfxUrl, cd)) {
            playSfxUrl(it.sfxUrl, vol);
          }
        }

        // Optional effects when spawned (e.g. confetti)
        (it.effects || []).forEach((fx) => overlay.effect(fx));

        pushItem(it);
        return;
      }

      // ---- CLEAR ----
      if (evt.type === EVT.STICKER_CLEAR) {
        setItems([]);
        return;
      }

      // ---- BURST ----
      if (evt.type === EVT.STICKER_BURST) {
        const p = evt.payload || {};
        const count = Math.max(1, Math.min(60, Number(p.count ?? 12)));
        const spread = clamp(p.spread ?? 18, 4, 60);
        const baseX = clamp(p.x ?? 50, 0, 100);
        const baseY = clamp(p.y ?? 50, 0, 100);

        // Play burst sfxUrl only once (cooldown still applies)
        if (p.sfxUrl) {
          const cd = Math.max(0, Number(p.sfxCooldownMs ?? 900)); // bursts: slightly longer default
          const vol = p.sfxVolume ?? 0.85;
          if (canPlayUrl(p.sfxUrl, cd)) {
            playSfxUrl(p.sfxUrl, vol);
          }
        }

        // Named sfx for burst (WebAudio) only once
        if (p.sfx) {
          overlay.effect({ type: "sfx", name: p.sfx, volume: p.sfxVolume ?? 0.06 });
        }

        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count;
          const r = spread * (0.3 + Math.random() * 0.7);
          const x = clamp(baseX + Math.cos(ang) * r, 0, 100);
          const y = clamp(baseY + Math.sin(ang) * r, 0, 100);

          const entry = p.entry || "zoomSpin";
          const exit = p.exit || "fade";
          const size = clamp((p.size ?? 56) * (0.75 + Math.random() * 0.6), 18, 240);

          pushItem({
            _runtimeId: uid(),
            _bornAt: Date.now(),
            url: p.url,
            emoji: p.emoji,
            text: p.text,
            x,
            y,
            size,
            rotate: Number(p.rotate ?? (Math.random() * 40 - 20)),
            entry,
            exit,
            durationMs: Number(p.durationMs ?? 950),
            clickable: Boolean(p.clickable),
            onClick: p.onClick,
            effects: p.effects || [],
            sfx: p.sfx,
            sfxUrl: p.sfxUrl,
            sfxVolume: p.sfxVolume,
            sfxCooldownMs: p.sfxCooldownMs,
          });
        }
        return;
      }
    });
  }, [maxActive]);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      aria-hidden="true"
    >
      {items.map((it) => (
        <FloatingSticker
          key={it._runtimeId}
          item={it}
          onClick={(ev) => {
            if (!it.clickable) return;
            ev?.stopPropagation?.();
            it.onClick?.(it);
          }}
        />
      ))}
    </div>
  );
}

function FloatingSticker({ item, onClick }) {
  const { x, y, size, rotate, url, emoji, text, entry, exit, durationMs, clickable } = item;

  const anim = animKey(entry, exit);
  const style = {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
    animation: `${anim} ${Math.max(200, durationMs)}ms ease-out forwards`,
    cursor: clickable ? "pointer" : "default",
    userSelect: "none",
    pointerEvents: clickable ? "auto" : "none",
  };

  return (
    <div className="absolute" style={style} onClick={onClick}>
      {url ? (
        <img src={url} alt="sticker" className="h-full w-full object-contain" draggable={false} />
      ) : (
        <div
          className="h-full w-full grid place-items-center"
          style={{
            fontSize: Math.max(14, Math.floor(size * 0.62)),
            filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.25))",
          }}
        >
          <span className="leading-none">{emoji || text || "✨"}</span>
        </div>
      )}

      <style>{`
        @keyframes ppEntry_floatUp__fade {
          0%   { opacity: 0; transform: translate(-50%, -30%) rotate(${rotate}deg) scale(0.92); }
          15%  { opacity: 1; }
          70%  { opacity: 1; transform: translate(-50%, -60%) rotate(${rotate}deg) scale(1.02); }
          100% { opacity: 0; transform: translate(-50%, -75%) rotate(${rotate}deg) scale(1.0); }
        }

        @keyframes ppEntry_flyLeft__fade {
          0%   { opacity: 0; transform: translate(-140%, -50%) rotate(${rotate - 12}deg) scale(0.92); }
          20%  { opacity: 1; transform: translate(-55%, -50%) rotate(${rotate}deg) scale(1.02); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-45%, -50%) rotate(${rotate + 2}deg) scale(1.0); }
        }

        @keyframes ppEntry_flyRight__fade {
          0%   { opacity: 0; transform: translate(40%, -50%) rotate(${rotate + 12}deg) scale(0.92); }
          20%  { opacity: 1; transform: translate(-45%, -50%) rotate(${rotate}deg) scale(1.02); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-55%, -50%) rotate(${rotate - 2}deg) scale(1.0); }
        }

        @keyframes ppEntry_flyTop__fade {
          0%   { opacity: 0; transform: translate(-50%, -160%) rotate(${rotate - 8}deg) scale(0.92); }
          18%  { opacity: 1; transform: translate(-50%, -55%) rotate(${rotate}deg) scale(1.04); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -45%) rotate(${rotate + 2}deg) scale(1.0); }
        }

        @keyframes ppEntry_flyBottom__fade {
          0%   { opacity: 0; transform: translate(-50%, 60%) rotate(${rotate + 8}deg) scale(0.92); }
          18%  { opacity: 1; transform: translate(-50%, -45%) rotate(${rotate}deg) scale(1.04); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -55%) rotate(${rotate - 2}deg) scale(1.0); }
        }

        @keyframes ppEntry_zoomSpin__fade {
          0%   { opacity: 0; transform: translate(-50%, -50%) rotate(${rotate - 90}deg) scale(0.25); }
          25%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.1); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate + 10}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(${rotate + 18}deg) scale(1.02); }
        }

        @keyframes ppEntry_dropBounce__fade {
          0%   { opacity: 0; transform: translate(-50%, -140%) rotate(${rotate - 10}deg) scale(0.9); }
          18%  { opacity: 1; transform: translate(-50%, -48%) rotate(${rotate}deg) scale(1.06); }
          30%  { transform: translate(-50%, -52%) rotate(${rotate}deg) scale(0.98); }
          45%  { transform: translate(-50%, -49%) rotate(${rotate}deg) scale(1.02); }
          75%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -45%) rotate(${rotate + 2}deg) scale(1.0); }
        }

        @keyframes ppEntry_shakePop__fade {
          0%   { opacity: 0; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(0.2); }
          20%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.15); }
          35%  { transform: translate(-48%, -50%) rotate(${rotate - 3}deg) scale(1.02); }
          50%  { transform: translate(-52%, -50%) rotate(${rotate + 3}deg) scale(1.02); }
          70%  { opacity: 1; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(${rotate}deg) scale(1.0); }
        }
      `}</style>
    </div>
  );
}

function animKey(entry, exit) {
  const e = entry || "floatUp";
  const x = exit || "fade";
  const key = `ppEntry_${e}__${x}`;

  const known = new Set([
    "ppEntry_floatUp__fade",
    "ppEntry_flyLeft__fade",
    "ppEntry_flyRight__fade",
    "ppEntry_flyTop__fade",
    "ppEntry_flyBottom__fade",
    "ppEntry_zoomSpin__fade",
    "ppEntry_dropBounce__fade",
    "ppEntry_shakePop__fade",
  ]);

  if (known.has(key)) return key;
  return "ppEntry_floatUp__fade";
}
