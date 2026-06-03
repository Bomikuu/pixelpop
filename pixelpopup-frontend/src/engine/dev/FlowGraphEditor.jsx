// src/engine/dev/FlowGraphEditor.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { ensureSchema, validateFlow } from "../authoring/flowSchema";
import { saveFlow, loadFlow, importFlowJson, exportFlowJson } from "../authoring/flowStorage";

const cx = (...c) => c.filter(Boolean).join(" ");

const DEFAULT_NODE_W = 260;
const DEFAULT_NODE_H = 120;

const SCENES = [
  "TypewriterPanel",
  "ChoicePanel",
  "PasswordGatePanel",
  "QuizPanel",
  "TimelinePanel",
  "MapPanel",
  "MediaLyricPanel",
];

function safeStr(v) {
  if (v == null) return "";
  return String(v);
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nodeLabel(node) {
  const p = node?.props || {};
  return p.title || node.scene || node.type || "NODE";
}

// ---------- flow -> graph ----------
function flowToGraph(flow) {
  const f = ensureSchema(flow);
  const rfNodes = [];
  const rfEdges = [];

  const nodes = f.nodes || {};
  const ids = Object.keys(nodes);

  ids.forEach((id, idx) => {
    const n = nodes[id] || {};
    const meta = n.meta || {};
    const pos = meta.pos || { x: 60 + (idx % 3) * 320, y: 60 + Math.floor(idx / 3) * 200 };

    rfNodes.push({
      id,
      type: "default",
      position: pos,
      data: {
        id,
        scene: n.scene || n.type || "TypewriterPanel",
        title: nodeLabel(n),
        isStart: id === f.start,
      },
      style: {
        border: "3px solid var(--pp-border)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.92)",
        boxShadow: "var(--pp-shadow)",
        width: DEFAULT_NODE_W,
        minHeight: DEFAULT_NODE_H,
        fontFamily: "var(--pp-font, inherit)",
      },
    });
  });

  const addTransitions = (fromId, eventName, routeDef) => {
    if (!routeDef) return;

    const pushEdge = (to, label) => {
      if (!to) return;
      const edgeId = `${fromId}::${label}::${to}::${Math.random().toString(16).slice(2)}`;
      rfEdges.push({
        id: edgeId,
        source: fromId,
        target: to,
        label,
        animated: false,
        style: { strokeWidth: 2 },
      });
    };

    if (typeof routeDef === "string") {
      pushEdge(routeDef, eventName);
      return;
    }

    if (Array.isArray(routeDef)) {
      routeDef.forEach((t, i) => {
        if (typeof t === "string") pushEdge(t, `${eventName}[${i}]`);
        else pushEdge(t?.to, t?.when ? `${eventName}[${i}] (guard)` : `${eventName}[${i}]`);
      });
      return;
    }

    if (typeof routeDef === "object") {
      pushEdge(routeDef.to, routeDef.when ? `${eventName} (guard)` : eventName);
    }
  };

  ids.forEach((fromId) => {
    const n = nodes[fromId] || {};
    const on = n.on || {};
    Object.entries(on).forEach(([evt, def]) => addTransitions(fromId, evt, def));
    if (n.default) addTransitions(fromId, "default", n.default);
  });

  return { rfNodes, rfEdges };
}

// ---------- graph -> flow (simple edge -> on map) ----------
function graphToFlow(baseFlow, rfNodes, rfEdges) {
  const f = ensureSchema(baseFlow);
  const nodes = { ...(f.nodes || {}) };

  // write positions
  rfNodes.forEach((n) => {
    const nodeId = n.id;
    const existing = nodes[nodeId] || {};
    nodes[nodeId] = {
      ...existing,
      scene: existing.scene || existing.type || (n.data?.scene ?? "TypewriterPanel"),
      meta: {
        ...(existing.meta || {}),
        pos: { x: n.position.x, y: n.position.y },
      },
      props: { ...(existing.props || {}) },
    };
  });

  // rebuild on maps from edge labels
  const onByNode = {};
  rfEdges.forEach((e) => {
    const from = e.source;
    const to = e.target;
    const raw = safeStr(e.label || "default");

    // normalize label -> eventName (strip [i] and (guard))
    const eventName = raw
      .replace(/\s*\(guard\)\s*/g, "")
      .replace(/\[\d+\]\s*/g, "")
      .trim() || "default";

    if (!onByNode[from]) onByNode[from] = {};
    if (!onByNode[from][eventName]) onByNode[from][eventName] = [];
    onByNode[from][eventName].push({ to });
  });

  Object.entries(onByNode).forEach(([fromId, map]) => {
    const existing = nodes[fromId] || {};
    const nextOn = { ...(existing.on || {}) };

    Object.entries(map).forEach(([evt, arr]) => {
      if (arr.length === 1) nextOn[evt] = arr[0].to;
      else nextOn[evt] = arr.map((x) => ({ to: x.to }));
    });

    nodes[fromId] = { ...existing, on: nextOn };
  });

  return { ...f, nodes };
}

// ---------- small UI helpers ----------
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <div className="font-pp text-xs opacity-70">{label}</div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      className="w-full border-[3px] rounded-xl px-2 py-1 font-pp text-xs"
      style={{ borderColor: "var(--pp-border)" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function NumInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      className="w-full border-[3px] rounded-xl px-2 py-1 font-pp text-xs"
      style={{ borderColor: "var(--pp-border)" }}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="w-full border-[3px] rounded-xl p-2 font-pp text-xs"
      style={{ borderColor: "var(--pp-border)" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 font-pp text-xs">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="opacity-80">{label}</span>
    </label>
  );
}

function SmallBtn({ children, onClick }) {
  return (
    <button
      type="button"
      className="pp-btn pp-btn--secondary"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ---------- Scene Props Editor (C2) ----------
function ScenePropsEditor({ scene, props, onPatchProps, onPatchNode }) {
  const p = props || {};

  // helpers
  const setProp = (key, val) => onPatchProps({ [key]: val });

  // arrays helpers
  const setArrayItem = (key, idx, patch) => {
    const arr = Array.isArray(p[key]) ? p[key] : [];
    const next = arr.map((it, i) => (i === idx ? { ...(it || {}), ...(patch || {}) } : it));
    setProp(key, next);
  };

  const addArrayItem = (key, base) => {
    const arr = Array.isArray(p[key]) ? p[key] : [];
    setProp(key, [...arr, base]);
  };

  const removeArrayItem = (key, idx) => {
    const arr = Array.isArray(p[key]) ? p[key] : [];
    setProp(key, arr.filter((_, i) => i !== idx));
  };

  if (scene === "TypewriterPanel") {
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Field label="text">
          <TextArea value={safeStr(p.text)} onChange={(v) => setProp("text", v)} rows={6} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="primaryText">
            <TextInput value={safeStr(p.primaryText)} onChange={(v) => setProp("primaryText", v)} />
          </Field>
          <Field label="secondaryText">
            <TextInput value={safeStr(p.secondaryText)} onChange={(v) => setProp("secondaryText", v)} />
          </Field>
        </div>
      </div>
    );
  }

  if (scene === "ChoicePanel") {
    const choices = Array.isArray(p.choices) ? p.choices : [];
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Field label="intro">
          <TextArea value={safeStr(p.intro)} onChange={(v) => setProp("intro", v)} rows={3} />
        </Field>
        <Field label="columns">
          <NumInput value={safeNum(p.columns, 2)} onChange={(v) => setProp("columns", v)} />
        </Field>

        <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">choices</div>
            <SmallBtn
              onClick={() =>
                addArrayItem("choices", { id: `choice_${choices.length + 1}`, label: "New Choice", description: "", kind: "primary" })
              }
            >
              + add
            </SmallBtn>
          </div>

          <div className="mt-2 space-y-2">
            {choices.map((c, i) => (
              <div
                key={c?.id || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("choices", i)}>remove</SmallBtn>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="id">
                    <TextInput value={safeStr(c?.id)} onChange={(v) => setArrayItem("choices", i, { id: v })} />
                  </Field>
                  <Field label="kind">
                    <TextInput value={safeStr(c?.kind || "primary")} onChange={(v) => setArrayItem("choices", i, { kind: v })} />
                  </Field>
                </div>

                <Field label="label">
                  <TextInput value={safeStr(c?.label)} onChange={(v) => setArrayItem("choices", i, { label: v })} />
                </Field>
                <Field label="description">
                  <TextArea value={safeStr(c?.description)} onChange={(v) => setArrayItem("choices", i, { description: v })} rows={2} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene === "PasswordGatePanel") {
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Field label="prompt">
          <TextArea value={safeStr(p.prompt)} onChange={(v) => setProp("prompt", v)} rows={3} />
        </Field>
        <Field label="hint">
          <TextInput value={safeStr(p.hint)} onChange={(v) => setProp("hint", v)} />
        </Field>
        <Field label="expectedPassword">
          <TextInput value={safeStr(p.expectedPassword)} onChange={(v) => setProp("expectedPassword", v)} />
        </Field>
      </div>
    );
  }

  if (scene === "QuizPanel") {
    const answers = Array.isArray(p.answers) ? p.answers : [];
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Field label="question">
          <TextArea value={safeStr(p.question)} onChange={(v) => setProp("question", v)} rows={3} />
        </Field>
        <Field label="explanation">
          <TextArea value={safeStr(p.explanation)} onChange={(v) => setProp("explanation", v)} rows={3} />
        </Field>
        <Field label="maxAttempts">
          <NumInput value={safeNum(p.maxAttempts, 3)} onChange={(v) => setProp("maxAttempts", v)} />
        </Field>

        <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">answers</div>
            <SmallBtn onClick={() => addArrayItem("answers", { label: "New", correct: false })}>+ add</SmallBtn>
          </div>

          <div className="mt-2 space-y-2">
            {answers.map((a, i) => (
              <div
                key={a?.label || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("answers", i)}>remove</SmallBtn>
                </div>
                <Field label="label">
                  <TextInput value={safeStr(a?.label)} onChange={(v) => setArrayItem("answers", i, { label: v })} />
                </Field>
                <Toggle
                  checked={!!a?.correct}
                  onChange={(v) => setArrayItem("answers", i, { correct: v })}
                  label="correct"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene === "TimelinePanel") {
    const items = Array.isArray(p.items) ? p.items : [];
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Toggle checked={p.showMedia ?? true} onChange={(v) => setProp("showMedia", v)} label="showMedia" />

        <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">items</div>
            <SmallBtn
              onClick={() =>
                addArrayItem("items", {
                  id: `item_${items.length + 1}`,
                  date: "",
                  title: "New Item",
                  subtitle: "",
                  description: "",
                })
              }
            >
              + add
            </SmallBtn>
          </div>

          <div className="mt-2 space-y-2">
            {items.map((it, i) => (
              <div
                key={it?.id || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("items", i)}>remove</SmallBtn>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="id">
                    <TextInput value={safeStr(it?.id)} onChange={(v) => setArrayItem("items", i, { id: v })} />
                  </Field>
                  <Field label="date">
                    <TextInput value={safeStr(it?.date)} onChange={(v) => setArrayItem("items", i, { date: v })} />
                  </Field>
                </div>

                <Field label="title">
                  <TextInput value={safeStr(it?.title)} onChange={(v) => setArrayItem("items", i, { title: v })} />
                </Field>
                <Field label="subtitle">
                  <TextInput value={safeStr(it?.subtitle)} onChange={(v) => setArrayItem("items", i, { subtitle: v })} />
                </Field>
                <Field label="description">
                  <TextArea value={safeStr(it?.description)} onChange={(v) => setArrayItem("items", i, { description: v })} rows={3} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene === "MapPanel") {
    const places = Array.isArray(p.places) ? p.places : [];
    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>
        <Toggle checked={!!p.showSidebar} onChange={(v) => setProp("showSidebar", v)} label="showSidebar" />
        <Field label="popupTitle">
          <TextInput value={safeStr(p.popupTitle)} onChange={(v) => setProp("popupTitle", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="initialZoom">
            <NumInput value={safeNum(p.initialZoom, 12)} onChange={(v) => setProp("initialZoom", v)} />
          </Field>
          <Field label="defaultSelectedId">
            <TextInput value={safeStr(p.defaultSelectedId)} onChange={(v) => setProp("defaultSelectedId", v)} />
          </Field>
        </div>

        <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">places</div>
            <SmallBtn
              onClick={() =>
                addArrayItem("places", {
                  id: `place_${places.length + 1}`,
                  title: "New Place",
                  subtitle: "",
                  badge: "",
                  description: "",
                  lng: 0,
                  lat: 0,
                  mediaUrl: "",
                  mediaType: "image",
                })
              }
            >
              + add
            </SmallBtn>
          </div>

          <div className="mt-2 space-y-2">
            {places.map((pl, i) => (
              <div
                key={pl?.id || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("places", i)}>remove</SmallBtn>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="id">
                    <TextInput value={safeStr(pl?.id)} onChange={(v) => setArrayItem("places", i, { id: v })} />
                  </Field>
                  <Field label="badge">
                    <TextInput value={safeStr(pl?.badge)} onChange={(v) => setArrayItem("places", i, { badge: v })} />
                  </Field>
                </div>

                <Field label="title">
                  <TextInput value={safeStr(pl?.title)} onChange={(v) => setArrayItem("places", i, { title: v })} />
                </Field>
                <Field label="subtitle">
                  <TextInput value={safeStr(pl?.subtitle)} onChange={(v) => setArrayItem("places", i, { subtitle: v })} />
                </Field>
                <Field label="description">
                  <TextArea value={safeStr(pl?.description)} onChange={(v) => setArrayItem("places", i, { description: v })} rows={3} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="lng">
                    <NumInput value={safeNum(pl?.lng, 0)} onChange={(v) => setArrayItem("places", i, { lng: v })} />
                  </Field>
                  <Field label="lat">
                    <NumInput value={safeNum(pl?.lat, 0)} onChange={(v) => setArrayItem("places", i, { lat: v })} />
                  </Field>
                </div>

                <Field label="mediaUrl">
                  <TextInput value={safeStr(pl?.mediaUrl)} onChange={(v) => setArrayItem("places", i, { mediaUrl: v })} />
                </Field>
                <Field label="mediaType (image|video)">
                  <TextInput value={safeStr(pl?.mediaType || "image")} onChange={(v) => setArrayItem("places", i, { mediaType: v })} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene === "MediaLyricPanel") {
    const lyrics = Array.isArray(p.lyrics) ? p.lyrics : [];
    const stickers = Array.isArray(p.stickers) ? p.stickers : [];
    const media = p.media || {};
    const bgMusic = p.bgMusic || {};

    return (
      <div className="space-y-2">
        <Field label="title">
          <TextInput value={safeStr(p.title)} onChange={(v) => setProp("title", v)} />
        </Field>

        <div className="border-t pt-2 space-y-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="font-pp font-extrabold text-xs">media</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="media.type (video|youtube|image|gif)">
              <TextInput
                value={safeStr(media.type || "video")}
                onChange={(v) => setProp("media", { ...media, type: v })}
              />
            </Field>
            <Field label="media.url">
              <TextInput
                value={safeStr(media.url)}
                onChange={(v) => setProp("media", { ...media, url: v })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              checked={media.loop ?? true}
              onChange={(v) => setProp("media", { ...media, loop: v })}
              label="media.loop"
            />
            <Toggle
              checked={media.muted ?? true}
              onChange={(v) => setProp("media", { ...media, muted: v })}
              label="media.muted"
            />
          </div>
          <Field label="useYouTubeApi">
            <Toggle checked={!!p.useYouTubeApi} onChange={(v) => setProp("useYouTubeApi", v)} label="enable YouTube API mode" />
          </Field>
        </div>

        <div className="border-t pt-2 space-y-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="font-pp font-extrabold text-xs">bgMusic (optional)</div>
          <Field label="bgMusic.url">
            <TextInput value={safeStr(bgMusic.url)} onChange={(v) => setProp("bgMusic", { ...bgMusic, url: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="bgMusic.volume">
              <NumInput value={bgMusic.volume ?? 0.6} onChange={(v) => setProp("bgMusic", { ...bgMusic, volume: v })} />
            </Field>
            <Field label="bgMusic.startAt">
              <NumInput value={bgMusic.startAt ?? 0} onChange={(v) => setProp("bgMusic", { ...bgMusic, startAt: v })} />
            </Field>
          </div>
          <Toggle checked={bgMusic.loop ?? true} onChange={(v) => setProp("bgMusic", { ...bgMusic, loop: v })} label="bgMusic.loop" />
          <Toggle checked={bgMusic.autoplay ?? true} onChange={(v) => setProp("bgMusic", { ...bgMusic, autoplay: v })} label="bgMusic.autoplay" />
        </div>

        <div className="border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">lyrics</div>
            <SmallBtn onClick={() => addArrayItem("lyrics", { t: 0, text: "new lyric" })}>+ add</SmallBtn>
          </div>
          <div className="mt-2 space-y-2">
            {lyrics.map((l, i) => (
              <div
                key={l?.id || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("lyrics", i)}>remove</SmallBtn>
                </div>
                <Field label="t (seconds)">
                  <NumInput value={safeNum(l?.t, 0)} onChange={(v) => setArrayItem("lyrics", i, { t: v })} />
                </Field>
                <Field label="text">
                  <TextArea value={safeStr(l?.text)} onChange={(v) => setArrayItem("lyrics", i, { text: v })} rows={2} />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="font-pp font-extrabold text-xs">stickers</div>
            <SmallBtn onClick={() => addArrayItem("stickers", { t: 0, emoji: "✨", x: 50, y: 50, size: 54, anim: "pop", durationMs: 900 })}>
              + add
            </SmallBtn>
          </div>
          <div className="mt-2 space-y-2">
            {stickers.map((s, i) => (
              <div
                key={s?.id || i}
                className="border-[3px] rounded-xl p-2 space-y-2"
                style={{ borderColor: "var(--pp-border)", background: "rgba(255,255,255,0.7)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-pp text-xs font-extrabold">#{i + 1}</div>
                  <SmallBtn onClick={() => removeArrayItem("stickers", i)}>remove</SmallBtn>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="t">
                    <NumInput value={safeNum(s?.t, 0)} onChange={(v) => setArrayItem("stickers", i, { t: v })} />
                  </Field>
                  <Field label="emoji">
                    <TextInput value={safeStr(s?.emoji)} onChange={(v) => setArrayItem("stickers", i, { emoji: v })} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="x (0-100)">
                    <NumInput value={safeNum(s?.x, 50)} onChange={(v) => setArrayItem("stickers", i, { x: v })} />
                  </Field>
                  <Field label="y (0-100)">
                    <NumInput value={safeNum(s?.y, 50)} onChange={(v) => setArrayItem("stickers", i, { y: v })} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="size">
                    <NumInput value={safeNum(s?.size, 54)} onChange={(v) => setArrayItem("stickers", i, { size: v })} />
                  </Field>
                  <Field label="durationMs">
                    <NumInput value={safeNum(s?.durationMs, 900)} onChange={(v) => setArrayItem("stickers", i, { durationMs: v })} />
                  </Field>
                </div>

                <Field label="anim (entry)">
                  <TextInput value={safeStr(s?.anim || s?.entry || "pop")} onChange={(v) => setArrayItem("stickers", i, { anim: v, entry: v })} />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <Toggle checked={!!p.allowTapSpawn} onChange={(v) => setProp("allowTapSpawn", v)} label="allowTapSpawn" />
      </div>
    );
  }

  return (
    <div className="font-pp text-xs opacity-70">
      No editor for scene: <span className="font-extrabold">{scene}</span>
      <div className="mt-2">
        You can still edit raw JSON below.
      </div>
    </div>
  );
}

export default function FlowGraphEditor({
  initialFlowId = "mega-demo",
  onRunFlow, // (flow) => void
}) {
  const [flowId, setFlowId] = useState(initialFlowId);
  const [flow, setFlow] = useState(() => loadFlow(initialFlowId) || null);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const [eventName, setEventName] = useState("select:map"); // used when creating new edges
  const [edgeLabelDraft, setEdgeLabelDraft] = useState("");
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState(null);

  const show = (type, message) => setNotice({ type, message, at: Date.now() });

  const { rfNodes: initialNodes, rfEdges: initialEdges } = useMemo(() => {
    if (!flow) return { rfNodes: [], rfEdges: [] };
    return flowToGraph(flow);
  }, [flow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // When flow changes, re-seed graph
  useEffect(() => {
    if (!flow) return;
    const g = flowToGraph(flow);
    setNodes(g.rfNodes);
    setEdges(g.rfEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [flow, setNodes, setEdges]);

  // Auto-save debounce
  const saveTimer = useRef(null);
  const scheduleSave = useCallback((nextFlow) => {
    if (!nextFlow?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        saveFlow(nextFlow);
        show("success", `Auto-saved: ${nextFlow.id}`);
      } catch (e) {
        show("error", String(e?.message || e));
      }
    }, 250);
  }, []);

  // commit graph -> flow
  const commitGraph = useCallback(
    (nextNodes = nodes, nextEdges = edges) => {
      if (!flow) return;
      const nextFlow = graphToFlow(flow, nextNodes, nextEdges);
      setFlow(nextFlow);
      scheduleSave(nextFlow);
    },
    [flow, nodes, edges, scheduleSave]
  );

  // C1: create edge with label from eventName
  const onConnect = useCallback(
    (params) => {
      const label = (eventName || "default").trim() || "default";
      const newEdge = {
        ...params,
        id: `${params.source}::${label}::${params.target}::${Date.now()}`,
        label,
        style: { strokeWidth: 2 },
      };

      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        setTimeout(() => commitGraph(nodes, next), 0);
        return next;
      });
    },
    [eventName, setEdges, commitGraph, nodes]
  );

  const onNodeDragStop = useCallback(() => {
    commitGraph(nodes, edges);
  }, [commitGraph, nodes, edges]);

  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }) => {
    const nid = selNodes?.[0]?.id || null;
    const eid = selEdges?.[0]?.id || null;
    setSelectedNodeId(nid);
    setSelectedEdgeId(eid);

    if (eid) {
      const e = (selEdges && selEdges[0]) || null;
      setEdgeLabelDraft(safeStr(e?.label || ""));
    }
  }, []);

  // also allow edge click selection
  const onEdgeClick = useCallback((evt, edge) => {
    evt.preventDefault();
    evt.stopPropagation();
    setSelectedEdgeId(edge.id);
    setEdgeLabelDraft(safeStr(edge.label || ""));
    setSelectedNodeId(null);
  }, []);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return flow?.nodes?.[selectedNodeId] || null;
  }, [flow, selectedNodeId]);

  const selectedScene = useMemo(() => {
    const s = selectedNode?.scene || selectedNode?.type;
    return s || "TypewriterPanel";
  }, [selectedNode]);

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return edges.find((e) => e.id === selectedEdgeId) || null;
  }, [edges, selectedEdgeId]);

  // C2 helpers: update node + props
  const updateNode = (patch) => {
    if (!selectedNodeId || !flow) return;
    const nodesMap = { ...(flow.nodes || {}) };
    const current = nodesMap[selectedNodeId] || {};
    nodesMap[selectedNodeId] = {
      ...current,
      ...patch,
      props: { ...(current.props || {}), ...(patch.props || {}) },
    };
    const nextFlow = { ...flow, nodes: nodesMap };
    setFlow(nextFlow);
    scheduleSave(nextFlow);

    // reflect in reactflow node label/scene
    setNodes((prev) =>
      prev.map((n) =>
        n.id !== selectedNodeId
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                scene: nodesMap[selectedNodeId].scene || n.data.scene,
                title: nodesMap[selectedNodeId].props?.title || nodeLabel(nodesMap[selectedNodeId]),
              },
            }
      )
    );
  };

  const patchProps = (propsPatch) => {
    updateNode({ props: propsPatch });
  };

  const renameNodeId = (newIdRaw) => {
    const newId = String(newIdRaw || "").trim();
    if (!newId || !flow || !selectedNodeId) return;
    if (flow.nodes?.[newId]) return show("error", `Node id "${newId}" already exists`);

    const nextNodesMap = { ...(flow.nodes || {}) };
    nextNodesMap[newId] = nextNodesMap[selectedNodeId];
    delete nextNodesMap[selectedNodeId];

    // rewrite transitions pointing to/from old id
    const oldId = selectedNodeId;
    Object.keys(nextNodesMap).forEach((nid) => {
      const n = nextNodesMap[nid];
      const on = n?.on || {};
      const rewrite = (def) => {
        if (!def) return def;
        if (typeof def === "string") return def === oldId ? newId : def;
        if (Array.isArray(def)) return def.map(rewrite);
        if (typeof def === "object") return { ...def, to: def.to === oldId ? newId : def.to };
        return def;
      };
      const nextOn = {};
      Object.entries(on).forEach(([evt, def]) => (nextOn[evt] = rewrite(def)));
      const nextDefault = rewrite(n.default);
      nextNodesMap[nid] = { ...n, on: nextOn, ...(n.default ? { default: nextDefault } : {}) };
    });

    const nextStart = flow.start === oldId ? newId : flow.start;
    const nextFlow = { ...flow, start: nextStart, nodes: nextNodesMap };

    setFlow(nextFlow);
    setSelectedNodeId(newId);

    // update reactflow graph ids
    setNodes((prev) => prev.map((n) => (n.id === oldId ? { ...n, id: newId } : n)));
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        source: e.source === oldId ? newId : e.source,
        target: e.target === oldId ? newId : e.target,
        id: e.id.replace(oldId, newId),
      }))
    );

    scheduleSave(nextFlow);
    show("success", `Renamed "${oldId}" → "${newId}"`);
  };

  const addNewNode = () => {
    if (!flow) return;
    const baseId = "node";
    let i = 1;
    while (flow.nodes?.[`${baseId}${i}`]) i++;
    const id = `${baseId}${i}`;

    const nodesMap = { ...(flow.nodes || {}) };
    nodesMap[id] = {
      scene: "TypewriterPanel",
      props: { title: `NEW_NODE_${i}`, text: "Edit me", primaryText: "Back" },
      on: { primary: flow.start || "start" },
      meta: { pos: { x: 80, y: 80 } },
    };

    const nextFlow = { ...flow, nodes: nodesMap };
    setFlow(nextFlow);

    setNodes((prev) => [
      ...prev,
      {
        id,
        type: "default",
        position: { x: 80 + prev.length * 20, y: 80 + prev.length * 20 },
        data: { id, scene: "TypewriterPanel", title: nodesMap[id].props.title, isStart: false },
        style: {
          border: "3px solid var(--pp-border)",
          borderRadius: 14,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "var(--pp-shadow)",
          width: DEFAULT_NODE_W,
          minHeight: DEFAULT_NODE_H,
          fontFamily: "var(--pp-font, inherit)",
        },
      },
    ]);

    scheduleSave(nextFlow);
    show("success", `Added node: ${id}`);
  };

  const setStartNode = () => {
    if (!flow || !selectedNodeId) return;
    const nextFlow = { ...flow, start: selectedNodeId };
    setFlow(nextFlow);
    scheduleSave(nextFlow);

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, isStart: n.id === selectedNodeId },
      }))
    );
  };

  // C1: update edge label (event name)
  const applyEdgeLabel = () => {
    if (!selectedEdgeId) return;
    const nextLabel = (edgeLabelDraft || "").trim();
    if (!nextLabel) return show("error", "Edge event name cannot be empty");

    setEdges((prev) => {
      const next = prev.map((e) => (e.id === selectedEdgeId ? { ...e, label: nextLabel } : e));
      setTimeout(() => commitGraph(nodes, next), 0);
      return next;
    });

    show("success", "Edge updated");
  };

  // C1: delete edge
  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges((prev) => {
      const next = prev.filter((e) => e.id !== selectedEdgeId);
      setSelectedEdgeId(null);
      setEdgeLabelDraft("");
      setTimeout(() => commitGraph(nodes, next), 0);
      return next;
    });
    show("success", "Edge deleted");
  };

  const doExport = () => {
    const txt = exportFlowJson(flow?.id);
    if (!txt) return show("error", "Nothing to export");
    setImportText(txt);
    show("success", "Exported into textbox");
  };

  const doImport = () => {
    try {
      const f = importFlowJson(importText);
      setFlowId(f.id);
      setFlow(f);
      show("success", `Imported: ${f.id}`);
    } catch (e) {
      show("error", String(e?.message || e));
    }
  };

  const doValidate = () => {
    if (!flow) return;
    const check = validateFlow(flow);
    if (check.ok) show("success", "Flow OK");
    else show("error", check.errors.join(" | "));
  };

  const doLoad = () => {
    const f = loadFlow(flowId);
    if (!f) return show("error", "Not found");
    setFlow(f);
    show("success", `Loaded ${f.id}`);
  };

  const doRun = () => {
    if (!flow) return;
    const check = validateFlow(flow);
    if (!check.ok) return show("error", check.errors.join(" | "));
    onRunFlow?.(flow);
  };

  return (
    <div className="w-full">
      {/* Top bar */}
      <div
        className="border-[3px] rounded-2xl p-3 mb-3 flex flex-wrap items-center justify-between gap-2"
        style={{
          borderColor: "var(--pp-border)",
          boxShadow: "var(--pp-shadow)",
          background: "rgba(255,255,255,0.92)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="font-pp font-extrabold text-sm">FLOW GRAPH EDITOR</div>

          <input
            className="border-[3px] rounded-xl px-2 py-1 font-pp text-xs w-[180px]"
            style={{ borderColor: "var(--pp-border)" }}
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            placeholder="flow id"
          />
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doLoad}>
            Load
          </button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={addNewNode}>
            + Node
          </button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doValidate}>
            Validate
          </button>
          <button className="pp-btn pp-btn--primary" type="button" onClick={doRun}>
            Run in Engine
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-pp text-xs opacity-70">New edge event:</div>
          <input
            className="border-[3px] rounded-xl px-2 py-1 font-pp text-xs w-[180px]"
            style={{ borderColor: "var(--pp-border)" }}
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. select:map"
          />
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doExport}>
            Export
          </button>
          <button className="pp-btn pp-btn--secondary" type="button" onClick={doImport}>
            Import
          </button>
        </div>

        {notice ? (
          <div className="w-full mt-2 font-pp text-xs">
            <span
              className={
                notice.type === "error"
                  ? "text-red-600"
                  : notice.type === "success"
                  ? "text-green-700"
                  : "text-slate-700"
              }
            >
              {notice.type.toUpperCase()}:
            </span>{" "}
            {notice.message}
          </div>
        ) : null}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
        {/* Graph */}
        <div
          className="border-[3px] rounded-2xl overflow-hidden"
          style={{
            borderColor: "var(--pp-border)",
            boxShadow: "var(--pp-shadow)",
            background: "rgba(255,255,255,0.7)",
          }}
        >
          <div style={{ height: "72vh", minHeight: 520 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              onSelectionChange={onSelectionChange}
              onEdgeClick={onEdgeClick}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>

        {/* Inspector */}
        <div
          className="border-[3px] rounded-2xl p-3"
          style={{
            borderColor: "var(--pp-border)",
            boxShadow: "var(--pp-shadow)",
            background: "rgba(255,255,255,0.92)",
          }}
        >
          <div className="font-pp font-extrabold text-sm">INSPECTOR</div>

          {/* C1: Edge inspector */}
          {selectedEdge ? (
            <div className="mt-3 space-y-2">
              <div className="font-pp text-xs opacity-70">Selected Edge</div>
              <div className="font-pp text-xs">
                <span className="font-extrabold">{selectedEdge.source}</span> →{" "}
                <span className="font-extrabold">{selectedEdge.target}</span>
              </div>

              <Field label="event label">
                <TextInput value={edgeLabelDraft} onChange={setEdgeLabelDraft} placeholder="e.g. select:map" />
              </Field>

              <div className="flex items-center gap-2">
                <button className="pp-btn pp-btn--primary w-full" type="button" onClick={applyEdgeLabel}>
                  Save Edge
                </button>
                <button className="pp-btn pp-btn--secondary w-full" type="button" onClick={deleteSelectedEdge}>
                  Delete
                </button>
              </div>

              <div className="mt-2 font-pp text-[11px] opacity-70">
                This edge label becomes the event name in <span className="font-extrabold">node.on[event]</span>.
              </div>

              <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
            </div>
          ) : null}

          {/* Node inspector */}
          {!selectedNodeId ? (
            !selectedEdge ? (
              <div className="mt-3 font-pp text-xs opacity-75">Click a node (or edge) to edit it.</div>
            ) : null
          ) : (
            <div className="mt-3 space-y-2">
              <Field label="Node ID (rename on blur)">
                <input
                  className="w-full border-[3px] rounded-xl px-2 py-1 font-pp text-xs"
                  style={{ borderColor: "var(--pp-border)" }}
                  defaultValue={selectedNodeId}
                  onBlur={(e) => renameNodeId(e.target.value)}
                />
              </Field>

              <div className="flex items-center gap-2">
                <button className="pp-btn pp-btn--secondary w-full" type="button" onClick={setStartNode}>
                  Set as Start
                </button>
              </div>

              <Field label="Scene">
                <select
                  className="w-full border-[3px] rounded-xl px-2 py-1 font-pp text-xs"
                  style={{ borderColor: "var(--pp-border)" }}
                  value={selectedScene}
                  onChange={(e) => updateNode({ scene: e.target.value })}
                >
                  {SCENES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              {/* C2: Real props forms */}
              <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="font-pp font-extrabold text-xs mb-2">Scene Props</div>
                <ScenePropsEditor
                  scene={selectedScene}
                  props={selectedNode?.props || {}}
                  onPatchProps={patchProps}
                  onPatchNode={updateNode}
                />
              </div>

              <div className="mt-3">
                <div className="font-pp text-xs opacity-70">Raw node JSON</div>
                <textarea
                  className="w-full border-[3px] rounded-xl p-2 font-mono text-xs h-[220px]"
                  style={{ borderColor: "var(--pp-border)" }}
                  value={JSON.stringify(flow?.nodes?.[selectedNodeId] || {}, null, 2)}
                  readOnly
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="font-pp text-xs font-extrabold opacity-70">Import / Export JSON</div>
            <textarea
              className="w-full border-[3px] rounded-xl p-2 font-mono text-xs h-[220px]"
              style={{ borderColor: "var(--pp-border)" }}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* tiny fallback css */}
      <style>{`
        .pp-btn {
          border: 3px solid var(--pp-border);
          border-radius: 12px;
          padding: 8px 10px;
          font-family: var(--pp-font, inherit);
          font-weight: 800;
          font-size: 12px;
          box-shadow: var(--pp-shadow);
          background: rgba(255,255,255,0.92);
        }
        .pp-btn--primary { background: var(--pp-accent); }
        .pp-btn--secondary { background: rgba(255,255,255,0.92); }
      `}</style>
    </div>
  );
}
