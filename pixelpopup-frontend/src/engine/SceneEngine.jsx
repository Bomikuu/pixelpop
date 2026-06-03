import React, { useEffect, useMemo, useState } from "react";
import { applyMutations, pickTransition } from "./core/flowRunTime";

import {
  TypewriterPanel,
  RetroChoicePanel,
  RetroPasswordGatePanel,
  RetroTimelinePanel,
  RetroMapPanel,
  RetroQuizPanel,
  RetroMediaLyricPanel,
} from "../ui/retro";

import WeddingHeroScene from "../ui/scenes/wedding/WeddingHeroScene";
import WeddingDetailsScene from "../ui/scenes/wedding/WeddingDetailsScene";
import WeddingRSVPScene from "../ui/scenes/wedding/WeddingRSVPScene";
import WeddingThankYouScene from "../ui/scenes/wedding/WeddingThankYouScene";
import WeddingScheduleScene from "../ui/scenes/wedding/WeddingScheduleScene";
import WeddingGalleryScene from "../ui/scenes/wedding/WeddingGalleryScene";
import WeddingPersonalizeScene from "../ui/scenes/wedding/WeddingPersonalizeScene";
import WeddingGuestMessagesScene from "../ui/scenes/wedding/WeddingGuestMessagesScene";

const SCENES = {
  TypewriterPanel,
  ChoicePanel: RetroChoicePanel,
  PasswordGatePanel: RetroPasswordGatePanel,
  TimelinePanel: RetroTimelinePanel,
  MapPanel: RetroMapPanel,
  QuizPanel: RetroQuizPanel,
  MediaLyricPanel: RetroMediaLyricPanel,

  WeddingHeroScene,
  WeddingDetailsScene,
  WeddingRSVPScene,
  WeddingThankYouScene,
  WeddingScheduleScene,
  WeddingGalleryScene,
  WeddingPersonalizeScene,
  WeddingGuestMessagesScene
};

const devLog = (...args) => {
  const ON = true;
  if (ON) console.log(...args);
};

export default function SceneEngine({ flow, initialNodeId, initialVars, onDone }) {
  const startId = initialNodeId || flow?.start || "start";

  const [runtime, setRuntime] = useState(() => {
    const base = { flow, nodeId: startId, vars: { ...(initialVars || {}) } };
    const node = flow?.nodes?.[startId];
    if (node?.mutations) return applyMutations(base, node.mutations, { eventName: "enter" });
    return base;
  });

  useEffect(() => {
    if (!flow) return;
    setRuntime(() => {
      const base = { flow, nodeId: startId, vars: { ...(initialVars || {}) } };
      const node = flow?.nodes?.[startId];
      if (node?.mutations) return applyMutations(base, node.mutations, { eventName: "enter" });
      return base;
    });
  }, [flow, startId, initialVars]);

  const node = runtime.flow?.nodes?.[runtime.nodeId];

  const engine = useMemo(() => {
    return {
      get vars() {
        return runtime.vars || {};
      },
      setVars(patch) {
        setRuntime((prev) => ({
          ...prev,
          vars: { ...(prev.vars || {}), ...(patch || {}) },
        }));
      },
      emit(eventName, payload) {
        devLog("[SceneEngine emit]", {
          nodeId: runtime.nodeId,
          scene: runtime.flow?.nodes?.[runtime.nodeId]?.scene,
          eventName,
          payload,
        });

        setRuntime((prev) => {
          const f = prev.flow;
          const cur = f?.nodes?.[prev.nodeId];
          if (!cur) return prev;

          const routeDef = cur.on?.[eventName] ?? null;
          let tr = pickTransition(routeDef, prev);

          if (!tr) {
            const fallback = cur.on?.default ?? cur.default ?? null;
            tr = pickTransition(fallback, prev);
          }

          if (!tr?.to) {
            if (eventName === "done") onDone?.(prev);
            return prev;
          }

          let nextState = prev;

          if (tr.mutations) {
            nextState = applyMutations(nextState, tr.mutations, { eventName, payload });
          }

          const nextNode = f?.nodes?.[tr.to];
          if (!nextNode) return nextState;

          nextState = { ...nextState, nodeId: tr.to };

          if (nextNode.mutations) {
            nextState = applyMutations(nextState, nextNode.mutations, { eventName: "enter", payload });
          }

          devLog("[SceneEngine transition]", {
            from: prev.nodeId,
            to: nextState.nodeId,
            toScene: nextNode.scene,
          });

          return nextState;
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime, onDone]);

  if (!node) {
    return (
      <div className="p-6">
        <div className="font-pp font-extrabold">SceneEngine</div>
        <div className="font-pp text-sm opacity-70">Missing node: {String(runtime.nodeId)}</div>
      </div>
    );
  }

  const Comp = SCENES[node.scene] || SCENES[node.type] || null;

  if (!Comp) {
    return (
      <div className="p-6">
        <div className="font-pp font-extrabold">Unknown scene</div>
        <div className="font-pp text-sm opacity-70">scene: {String(node.scene)}</div>
      </div>
    );
  }

  const baseProps = node.props || {};

  const wiredProps = useMemo(() => {
    const sceneKey = node.scene || node.type;
    const p = { ...baseProps };

    const ensure = (key, fn) => {
      if (p[key] == null) p[key] = fn;
    };

    // Typewriter
    if (sceneKey === "TypewriterPanel") {
      ensure("onPrimary", () => engine.emit("primary"));
      ensure("onSecondary", () => engine.emit("secondary"));
      ensure("onDone", () => engine.emit("done"));
    }

    // ✅ ChoicePanel FIX: only use onChoose (because ChoicePanel already calls both)
    // We intentionally disable per-choice onSelect to prevent double-emits.
    if (sceneKey === "ChoicePanel") {
      const emitChoice = (choiceLike) => {
        const rawId = choiceLike?.id ?? choiceLike?.value ?? choiceLike?.key;
        const id = rawId != null ? String(rawId) : "unknown";

        devLog("[SceneEngine ChoicePanel]", { pickedId: id, raw: choiceLike });

        engine.emit(`select:${id}`, choiceLike);
      };

      ensure("onChoose", (choice) => emitChoice(choice));

      if (Array.isArray(p.choices)) {
        p.choices = p.choices.map((c) => {
          if (!c) return c;
          // disable onSelect so ChoicePanel doesn't fire it + onChoose (double)
          return { ...c, onSelect: null };
        });
      }
    }

    // PasswordGate
    if (sceneKey === "PasswordGatePanel") {
      ensure("onSuccess", (payload) => engine.emit("success", payload));
      ensure("onFail", (payload) => engine.emit("fail", payload));
      ensure("onCancel", (payload) => engine.emit("cancel", payload));
    }

    // Quiz
    if (sceneKey === "QuizPanel") {
      ensure("onCorrect", (payload) => engine.emit("correct", payload));
      ensure("onWrong", (payload) => engine.emit("wrong", payload));
      ensure("onDone", (payload) => engine.emit("done", payload));
    }

if (sceneKey === "TimelinePanel") {
  // keep existing onSelect (if panel uses it in the future)
  ensure("onSelect", (item) => {
    const id = item?.id ?? "unknown";
    engine.emit(`select:${id}`, item);
    engine.emit("select", item);
  });

  // Inject action onClick so buttons can route
  if (Array.isArray(p.items)) {
    p.items = p.items.map((it) => {
      if (!it) return it;
      const itemId = String(it.id ?? "unknown");

      const actions = Array.isArray(it.actions) ? it.actions : [];
      const nextActions = actions.map((a) => {
        if (!a) return a;
        if (typeof a.onClick === "function") return a;

        const actionId = String(a.id ?? a.label ?? "action");
        return {
          ...a,
          onClick: () => {
            engine.emit(`select:${itemId}:${actionId}`, { item: it, action: a });
          },
        };
      });

      return { ...it, actions: nextActions };
    });
  }
}

    // MapPanel: map calls onSelect(place)
    if (sceneKey === "MapPanel") {
      ensure("onSelect", (place) => {
        const id = String(place?.id ?? "unknown");
        engine.emit(`select:${id}`, place);
      });
    }

    // MediaLyricPanel (only works if your component calls props.onDone somewhere)
    if (sceneKey === "MediaLyricPanel") {
      ensure("onDone", (payload) => engine.emit("done", payload));
    }

    if (sceneKey === "WeddingHeroScene") {
  ensure("onPrimary", () => engine.emit("primary"));
  ensure("onSecondary", () => engine.emit("secondary"));
}

if (sceneKey === "WeddingDetailsScene") {
  ensure("onPrimary", () => engine.emit("primary"));
  ensure("onSecondary", () => engine.emit("secondary"));
  ensure("onOpenMap", () => engine.emit("openMap"));
  ensure("onOpenSchedule", () => engine.emit("openSchedule"));
  ensure("onOpenMessages", () => engine.emit("openMessages"));
  ensure("onOpenPersonalize", () => engine.emit("openPersonalize"));
}

if (sceneKey === "WeddingScheduleScene") {
  ensure("onPrimary", () => engine.emit("primary"));   // back to details
  ensure("onSecondary", () => engine.emit("secondary"));// rsvp
  ensure("onClose", () => engine.emit("primary"));
}

if (sceneKey === "WeddingGuestMessagesScene") {
  ensure("onPrimary", () => engine.emit("primary"));   // back
  ensure("onSecondary", () => engine.emit("secondary"));// rsvp
}

if (sceneKey === "WeddingThankYouScene") {
  ensure("onPrimary", () => engine.emit("primary"));
}

if (sceneKey === "WeddingRSVPScene") {
  ensure("onSecondary", () => engine.emit("cancel"));
  // submit uses engine.emit("done") internally
}

if (sceneKey === "WeddingGalleryScene") {
  ensure("onBack", () => engine.emit("back"));
  ensure("onRSVP", () => engine.emit("rsvp"));
}

if (sceneKey === "WeddingPersonalizeScene") {
  ensure("onBack", () => engine.emit("back"));
  ensure("onDone", () => engine.emit("done"));
}
    return p;
  }, [node.scene, node.type, baseProps, engine]);

  devLog("[SceneEngine render]", { nodeId: runtime.nodeId, scene: node.scene });

  return (
    <div>
      <Comp {...wiredProps} engine={engine} vars={runtime.vars} />
    </div>
  );
}
