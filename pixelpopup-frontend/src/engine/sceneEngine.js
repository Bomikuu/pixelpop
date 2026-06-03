export function indexScenes(scenes = []) {
  const byId = new Map();
  scenes.forEach((s, i) => {
    if (!s?.id) throw new Error(`Scene missing id at index ${i}`);
    byId.set(s.id, { ...s, _index: i });
  });
  return byId;
}

export function getInitialSceneId(flow) {
  if (!flow) throw new Error("Flow required");
  if (flow.start) return flow.start;
  if (Array.isArray(flow.scenes) && flow.scenes[0]?.id) return flow.scenes[0].id;
  throw new Error("Flow has no start and no scenes");
}

export function getScene(byId, sceneId) {
  const s = byId.get(sceneId);
  if (!s) throw new Error(`Unknown scene id: ${sceneId}`);
  return s;
}

/**
 * Transition rules:
 * - explicit next: scene.next
 * - branching: scene.branches?.[key]
 * - fallback: next scene in array (by index)
 */
export function resolveNextSceneId({ byId, flow, currentScene, branchKey }) {
  // Branch wins if provided and exists
  if (branchKey && currentScene?.branches && currentScene.branches[branchKey]) {
    return currentScene.branches[branchKey];
  }

  // Explicit next
  if (currentScene?.next) return currentScene.next;

  // Implicit next by order
  const scenes = flow?.scenes || [];
  const idx = currentScene?._index ?? -1;
  const next = scenes[idx + 1];
  return next?.id || null;
}

/**
 * Optional side effects declared in scene.effects:
 * [
 *   { type:"toast", payload:{...} }
 *   { type:"effect", payload:{...} }
 *   { type:"modal", payload:{...} }
 *   { type:"loading:show", payload:{...} }
 *   { type:"loading:hide" }
 *   { type:"sticker", payload:{...} }
 *   { type:"burst", payload:{...} }
 * ]
 */
export function runSceneEffects(overlay, effects = []) {
  if (!overlay || !Array.isArray(effects)) return;

  effects.forEach((fx) => {
    if (!fx) return;
    if (fx.type === "toast") overlay.toast(fx.payload || {});
    if (fx.type === "effect") overlay.effect(fx.payload || {});
    if (fx.type === "modal") overlay.showModal(fx.payload || {});
    if (fx.type === "loading:show") overlay.showLoading(fx.payload || {});
    if (fx.type === "loading:hide") overlay.hideLoading();
    if (fx.type === "sticker") overlay.spawnSticker(fx.payload || {});
    if (fx.type === "burst") overlay.spawnBurst(fx.payload || {});
    if (fx.type === "stickers:clear") overlay.clearStickers();
  });
}
