export function canSpawnSticker(stateMap, id, nowSec, { maxSpawns = 1, cooldownMs = 0 } = {}) {
  const st = stateMap.get(id) || { count: 0, lastAtSec: -999999 };
  if (maxSpawns != null && st.count >= maxSpawns) return false;

  if (cooldownMs > 0) {
    const cd = cooldownMs / 1000;
    if (nowSec - st.lastAtSec < cd) return false;
  }
  return true;
}

export function markSpawnSticker(stateMap, id, nowSec) {
  const st = stateMap.get(id) || { count: 0, lastAtSec: -999999 };
  stateMap.set(id, { count: st.count + 1, lastAtSec: nowSec });
}

export function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

export function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
