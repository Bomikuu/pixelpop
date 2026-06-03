import React, { useEffect, useMemo, useRef, useState } from "react";
import RetroPanel from "./Panel";
import RetroButton from "./Button";
import { overlay } from "../overlay";
import { canSpawnSticker, markSpawnSticker, clamp, uid } from "./effects/stickerEngine";

const cx = (...c) => c.filter(Boolean).join(" ");

function parseYouTubeId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s) && !s.includes("http")) return s;

  try {
    const u = new URL(s);
    const host = u.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];

      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {}
  return null;
}

let _ytApiPromise = null;
function loadYouTubeIframeApiOnce() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (_ytApiPromise) return _ytApiPromise;

  _ytApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pp-yt="1"]');
    if (existing) {
      const check = () => {
        if (window.YT && window.YT.Player) resolve(window.YT);
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.defer = true;
    tag.dataset.ppYt = "1";

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try { prev?.(); } catch {}
      resolve(window.YT);
    };

    tag.onerror = () => reject(new Error("Failed to load YouTube Iframe API"));
    document.head.appendChild(tag);
  });

  return _ytApiPromise;
}

function findActiveLyricIndex(lines, t) {
  if (!lines?.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (t >= lines[i].t) idx = i;
    else break;
  }
  return idx;
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function MediaLyricPanel({
  title = "MEDIA.EXE",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  media = { type: "video", url: "" },
  useYouTubeApi = false,

  bgMusic,

  lyrics = [],
  lyricDefaultPos = { x: 50, y: 78, align: "center" },
  lyricBox = true,

  stickers = [],
  allowTapSpawn = false,
  tapSpawnPreset = {
    emoji: "✨",
    size: 42,
    entry: "shakePop",
    exit: "fade",
    durationMs: 900,
    sfx: { name: "beep", volume: 0.03 },
  },

  startAt = 0,
  autoPlay = true,
  showControls = true,

  // NEW: flow hook
  onDone, // () => void

  frameBorder = "var(--pp-border)",
  frameShadow = "var(--pp-shadow)",
  frameBg = "rgba(255,255,255,0.92)",
}) {
  const videoRef = useRef(null);

  const ytMountRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);

  const bgAudioRef = useRef(null);

  const rafRef = useRef(null);
  const lastTickRef = useRef(performance.now());

  const [playing, setPlaying] = useState(Boolean(autoPlay));
  const [t, setT] = useState(startAt);
  const [activeLyricIdx, setActiveLyricIdx] = useState(-1);

  const isYouTube = media?.type === "youtube";
  const isVideo = media?.type === "video";
  const ytId = useMemo(() => (isYouTube ? parseYouTubeId(media?.url) : null), [isYouTube, media?.url]);

  const ytStart = Number(media?.start ?? startAt ?? 0);
  const ytEnd = media?.end != null ? Number(media?.end) : null;

  const normalizedLyrics = useMemo(() => {
    return (lyrics || [])
      .map((l, i) => ({
        id: l.id ?? String(i),
        t: Number(l.t ?? 0),
        text: String(l.text ?? ""),
        position: l.position,
        className: l.className,
        effects: l.effects || [],
      }))
      .sort((a, b) => a.t - b.t);
  }, [lyrics]);

  const normalizedStickers = useMemo(() => {
    return (stickers || [])
      .map((s, i) => ({
        id: s.id ?? String(i),
        t: Number(s.t ?? 0),

        url: s.url,
        emoji: s.emoji,
        text: s.text,

        x: clamp(s.x ?? (15 + i * 10), 0, 100),
        y: clamp(s.y ?? (30 + i * 7), 0, 100),
        size: clamp(s.size ?? 54, 18, 260),
        rotate: Number(s.rotate ?? 0),

        entry: s.entry || s.anim || "floatUp",
        exit: s.exit || "fade",
        durationMs: Number(s.durationMs ?? 1100),

        effects: s.effects || [],
        sfx: s.sfx,

        cooldownMs: Number(s.cooldownMs ?? 0),
        maxSpawns: Number.isFinite(Number(s.maxSpawns)) ? Number(s.maxSpawns) : 1,
      }))
      .sort((a, b) => a.t - b.t);
  }, [stickers]);

  const ytSrc = useMemo(() => {
    if (!ytId) return "";
    const params = new URLSearchParams();
    params.set("autoplay", autoPlay ? "1" : "0");
    params.set("mute", media?.muted === false ? "0" : "1");
    params.set("controls", "0");
    params.set("playsinline", "1");
    params.set("rel", "0");
    params.set("modestbranding", "1");
    params.set("iv_load_policy", "3");
    if (Number.isFinite(ytStart) && ytStart > 0) params.set("start", String(Math.floor(ytStart)));
    if (Number.isFinite(ytEnd) && ytEnd > 0) params.set("end", String(Math.floor(ytEnd)));
    if (media?.loop ?? true) {
      params.set("loop", "1");
      params.set("playlist", ytId);
    } else {
      params.set("loop", "0");
    }
    return `https://www.youtube.com/embed/${ytId}?${params.toString()}`;
  }, [ytId, autoPlay, media?.muted, media?.loop, ytStart, ytEnd]);

  const spawnStateRef = useRef(new Map());

  useEffect(() => {
    const a = bgAudioRef.current;
    if (!a) return;

    const vol = clamp(bgMusic?.volume ?? 0.6, 0, 1);
    a.volume = vol;
    a.loop = bgMusic?.loop ?? true;

    const desiredStart = Number(bgMusic?.startAt ?? startAt ?? 0);
    if (Number.isFinite(desiredStart) && desiredStart >= 0) {
      try { a.currentTime = desiredStart; } catch {}
    }

    if (bgMusic?.autoplay ?? autoPlay) {
      if (playing) a.play?.().catch(() => {});
    }
  }, [bgMusic?.url, bgMusic?.loop, bgMusic?.volume, bgMusic?.startAt, startAt, autoPlay, playing]);

  const syncBgAudioPlayState = (shouldPlay) => {
    const a = bgAudioRef.current;
    if (!a || !bgMusic?.url) return;
    if (shouldPlay) a.play?.().catch(() => {});
    else a.pause?.();
  };

  const seekBgAudio = (sec) => {
    const a = bgAudioRef.current;
    if (!a || !bgMusic?.url) return;
    try { a.currentTime = Math.max(0, sec || 0); } catch {}
  };

  useEffect(() => {
    if (!isYouTube) return;
    if (!useYouTubeApi) return;
    if (!ytId) return;
    if (!ytMountRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const YT = await loadYouTubeIframeApiOnce();
        if (cancelled) return;

        if (ytPlayerRef.current?.destroy) {
          try { ytPlayerRef.current.destroy(); } catch {}
        }
        ytReadyRef.current = false;

        ytPlayerRef.current = new YT.Player(ytMountRef.current, {
          videoId: ytId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            start: Number.isFinite(ytStart) ? Math.floor(ytStart) : 0,
            end: Number.isFinite(ytEnd) ? Math.floor(ytEnd) : undefined,
            loop: (media?.loop ?? true) ? 1 : 0,
            playlist: (media?.loop ?? true) ? ytId : undefined,
          },
          events: {
            onReady: (e) => {
              ytReadyRef.current = true;
              if (media?.muted ?? true) {
                try { e.target.mute(); } catch {}
              } else {
                try { e.target.unMute(); } catch {}
              }
              if (autoPlay) {
                try { e.target.playVideo(); } catch {}
              }
            },
            onStateChange: (e) => {
              if (e.data === 1) setPlaying(true);
              if (e.data === 2) setPlaying(false);
              if (e.data === 0) {
                if (media?.loop ?? true) {
                  try {
                    e.target.seekTo(ytStart || 0, true);
                    e.target.playVideo();
                  } catch {}
                } else {
                  setPlaying(false);
                }
              }
            },
          },
        });
      } catch {}
    })();

    return () => {
      cancelled = true;
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy(); } catch {}
      }
      ytPlayerRef.current = null;
      ytReadyRef.current = false;
    };
  }, [isYouTube, useYouTubeApi, ytId, autoPlay, ytStart, ytEnd, media?.loop, media?.muted]);

  useEffect(() => {
    if (activeLyricIdx < 0) return;
    const line = normalizedLyrics[activeLyricIdx];
    if (!line) return;
    (line.effects || []).forEach((e) => overlay.effect(e));
  }, [activeLyricIdx, normalizedLyrics]);

  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [isVideo]);

  useEffect(() => {
    const tick = () => {
      let current = t;

      if (isVideo) {
        const v = videoRef.current;
        current = v?.currentTime || 0;
      } else if (isYouTube && useYouTubeApi && ytReadyRef.current && ytPlayerRef.current?.getCurrentTime) {
        try {
          current = ytPlayerRef.current.getCurrentTime() || 0;
        } catch {
          current = current || 0;
        }
      } else {
        const now = performance.now();
        const dt = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        if (playing) current = (current || 0) + dt;

        if (isYouTube && ytEnd != null && Number.isFinite(ytEnd)) {
          if (current > ytEnd) {
            if (media?.loop ?? true) current = ytStart || 0;
            else {
              current = ytEnd;
              setPlaying(false);
            }
          }
        }
      }

      setT(current);

      const idx = findActiveLyricIndex(normalizedLyrics, current);
      setActiveLyricIdx(idx);

      spawnScheduledStickers(current);

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, isVideo, isYouTube, useYouTubeApi, ytEnd, ytStart, media?.loop, normalizedLyrics, normalizedStickers]);

  function spawnScheduledStickers(current) {
    const windowSec = 0.18;
    const toSpawn = normalizedStickers.filter((s) => Math.abs(current - s.t) <= windowSec);

    if (!toSpawn.length) return;

    toSpawn.forEach((s) => {
      if (!canSpawnSticker(spawnStateRef.current, s.id, current, { maxSpawns: s.maxSpawns, cooldownMs: s.cooldownMs })) {
        return;
      }
      markSpawnSticker(spawnStateRef.current, s.id, current);

      overlay.spawnSticker({
        url: s.url,
        emoji: s.emoji,
        text: s.text,
        x: s.x,
        y: s.y,
        size: s.size,
        rotate: s.rotate,
        entry: s.entry,
        exit: s.exit,
        durationMs: s.durationMs,
      });

      (s.effects || []).forEach((e) => overlay.effect(e));
      if (s.sfx) {
        if (typeof s.sfx === "string") overlay.effect({ type: "sfx", name: s.sfx });
        else overlay.effect({ type: "sfx", ...s.sfx });
      }
    });
  }

  const togglePlay = async () => {
    if (isVideo) {
      const v = videoRef.current;
      if (!v) return;
      try {
        if (v.paused) {
          await v.play();
          syncBgAudioPlayState(true);
        } else {
          v.pause();
          syncBgAudioPlayState(false);
        }
        overlay.effect({ type: "sfx", name: "beep" });
      } catch {}
      return;
    }

    if (isYouTube && useYouTubeApi && ytReadyRef.current && ytPlayerRef.current) {
      try {
        const state = ytPlayerRef.current.getPlayerState?.();
        if (state === 1) {
          ytPlayerRef.current.pauseVideo?.();
          syncBgAudioPlayState(false);
        } else {
          ytPlayerRef.current.playVideo?.();
          syncBgAudioPlayState(true);
        }
        overlay.effect({ type: "sfx", name: "beep" });
      } catch {
        setPlaying((p) => {
          const next = !p;
          syncBgAudioPlayState(next);
          return next;
        });
        overlay.effect({ type: "sfx", name: "beep" });
      }
      return;
    }

    setPlaying((p) => {
      const next = !p;
      syncBgAudioPlayState(next);
      return next;
    });
    overlay.effect({ type: "sfx", name: "beep" });
  };

  const restart = () => {
    spawnStateRef.current = new Map();

    if (isVideo) {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = startAt || 0;
      v.play?.();
      syncBgAudioPlayState(true);
      seekBgAudio(bgMusic?.startAt ?? (startAt || 0));
      overlay.effect({ type: "vhs", ms: 520, strength: 10, aberration: 2 });
      return;
    }

    if (isYouTube && useYouTubeApi && ytReadyRef.current && ytPlayerRef.current) {
      try {
        const base = ytStart || 0;
        ytPlayerRef.current.seekTo?.(base, true);
        ytPlayerRef.current.playVideo?.();
        syncBgAudioPlayState(true);
        seekBgAudio(bgMusic?.startAt ?? base);
        overlay.effect({ type: "vhs", ms: 520, strength: 10, aberration: 2 });
        return;
      } catch {}
    }

    const base = isYouTube ? (ytStart || 0) : (startAt || 0);
    setT(base);
    setPlaying(true);
    syncBgAudioPlayState(true);
    seekBgAudio(bgMusic?.startAt ?? base);
    overlay.effect({ type: "vhs", ms: 520, strength: 10, aberration: 2 });
  };

  const handleTapSpawn = (e) => {
    if (!allowTapSpawn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const p = tapSpawnPreset || {};
    const item = {
      id: uid(),
      x,
      y,
      size: p.size ?? 42,
      rotate: p.rotate ?? 0,
      entry: p.entry ?? "shakePop",
      exit: p.exit ?? "fade",
      durationMs: p.durationMs ?? 900,
      emoji: p.emoji,
      text: p.text,
      url: p.url,
      effects: p.effects || [],
      sfx: p.sfx,
    };

    overlay.spawnSticker(item);

    (item.effects || []).forEach((fx) => overlay.effect(fx));
    if (item.sfx) {
      if (typeof item.sfx === "string") overlay.effect({ type: "sfx", name: item.sfx });
      else overlay.effect({ type: "sfx", ...item.sfx });
    }
  };

  const activeLine = activeLyricIdx >= 0 ? normalizedLyrics[activeLyricIdx] : null;
  const pos = activeLine?.position || lyricDefaultPos;

  const modeLabel = isYouTube ? (useYouTubeApi ? "YOUTUBE (API)" : "YOUTUBE") : isVideo ? "VIDEO" : "IMAGE/GIF";

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className="p-4 space-y-3">
        <div
          className="border-[3px] rounded-2xl overflow-hidden relative"
          style={{ borderColor: frameBorder, boxShadow: frameShadow, background: frameBg }}
        >
          <div className="relative w-full aspect-video overflow-hidden" onClick={handleTapSpawn}>
            {isYouTube ? (
              useYouTubeApi ? (
                ytId ? (
                  <div className="absolute inset-0" ref={ytMountRef} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="font-pp font-extrabold text-sm opacity-80">Invalid YouTube URL/ID</div>
                  </div>
                )
              ) : ytSrc ? (
                <iframe
                  title="YouTube"
                  src={ytSrc}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="font-pp font-extrabold text-sm opacity-80">Invalid YouTube URL/ID</div>
                </div>
              )
            ) : isVideo ? (
              <video
                ref={videoRef}
                src={media?.url}
                poster={media?.poster}
                className="absolute inset-0 h-full w-full object-cover"
                loop={media?.loop ?? true}
                muted={media?.muted ?? true}
                autoPlay={media?.autoplay ?? autoPlay}
                playsInline
                controls={false}
              />
            ) : (
              <img
                src={media?.url}
                alt="background"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}

            {bgMusic?.url ? <audio ref={bgAudioRef} src={bgMusic.url} preload="auto" /> : null}

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.15))",
              }}
            />

            {activeLine?.text ? (
              <div
                className={cx(
                  "absolute z-20",
                  pos?.align === "left" ? "text-left" : pos?.align === "right" ? "text-right" : "text-center"
                )}
                style={{
                  left: `${clamp(pos?.x ?? 50, 0, 100)}%`,
                  top: `${clamp(pos?.y ?? 78, 0, 100)}%`,
                  transform: "translate(-50%, -50%)",
                  width: "92%",
                }}
              >
                <div
                  className={cx(
                    "font-pp font-extrabold text-white drop-shadow",
                    lyricBox ? "inline-block px-3 py-2 border-[3px] rounded-xl" : "",
                    activeLine.className || ""
                  )}
                  style={{
                    borderColor: lyricBox ? "rgba(255,255,255,0.7)" : "transparent",
                    background: lyricBox ? "rgba(0,0,0,0.45)" : "transparent",
                    boxShadow: lyricBox ? "0 6px 0 rgba(0,0,0,0.25)" : "none",
                  }}
                >
                  {activeLine.text}
                </div>
              </div>
            ) : null}

            <div className="absolute left-2 top-2 z-30">
              <span
                className="font-pp text-[10px] font-extrabold px-2 py-1 border-[3px] rounded-lg"
                style={{
                  borderColor: "rgba(255,255,255,0.65)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                }}
              >
                {formatTime(t)}
              </span>
            </div>

            {allowTapSpawn ? (
              <div className="absolute right-2 top-2 z-30">
                <span
                  className="font-pp text-[10px] font-extrabold px-2 py-1 border-[3px] rounded-lg"
                  style={{
                    borderColor: "rgba(255,255,255,0.65)",
                    background: "rgba(0,0,0,0.35)",
                    color: "white",
                  }}
                >
                  TAP TO SPAWN
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {showControls ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-pp text-xs opacity-80">
              Mode: <span className="font-extrabold">{modeLabel}</span>
              {bgMusic?.url ? <span className="ml-2 opacity-70">• BG MUSIC</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "crt", ms: 1200 })}>
                CRT
              </RetroButton>
              <RetroButton variant="secondary" onClick={() => overlay.effect({ type: "vhs", ms: 900, strength: 12 })}>
                VHS
              </RetroButton>
              <RetroButton variant="secondary" onClick={restart}>
                Restart
              </RetroButton>
              <RetroButton onClick={togglePlay}>
                {playing ? "Pause" : "Play"}
              </RetroButton>

              {/* NEW: done hook for SceneEngine */}
              <RetroButton
                variant="primary"
                onClick={() => {
                  try { onDone?.({ t }); } catch {}
                }}
              >
                Done
              </RetroButton>
            </div>
          </div>
        ) : null}
      </div>
    </RetroPanel>
  );
}
