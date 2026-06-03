// src/engine/authoring/flowStorage.js
import { ensureSchema, validateFlow, FLOW_SCHEMA_VERSION } from "./flowSchema";

const KEY_PREFIX = "pp:flows:"; // pp:flows:<id>
const INDEX_KEY = "pp:flows:index"; // list of saved ids
const SNAP_PREFIX = "pp:flowSnapshots:"; // pp:flowSnapshots:<id>

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function readIndex() {
  const raw = localStorage.getItem(INDEX_KEY);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeIndex(ids) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function listSavedFlows() {
  const ids = readIndex();
  return ids
    .map((id) => {
      const raw = localStorage.getItem(KEY_PREFIX + id);
      const pack = safeParse(raw, null);
      if (!pack) return null;
      return {
        id: pack.id,
        updatedAt: pack.updatedAt,
        createdAt: pack.createdAt,
        schemaVersion: pack.schemaVersion,
        title: pack.title || pack.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

/**
 * Save authored flow (packaged)
 * pack shape:
 * { id, title?, schemaVersion, createdAt, updatedAt, flow }
 */
export function saveFlow(flowLike, { title } = {}) {
  const flow = migrateFlow(flowLike);
  const check = validateFlow(flow);
  if (!check.ok) {
    const msg = `Flow validation failed:\n- ${check.errors.join("\n- ")}`;
    throw new Error(msg);
  }

  const id = String(flow.id);
  const key = KEY_PREFIX + id;

  const existing = safeParse(localStorage.getItem(key), null);
  const createdAt = existing?.createdAt || nowIso();

  const pack = {
    id,
    title: title ?? existing?.title ?? id,
    schemaVersion: flow.schemaVersion ?? FLOW_SCHEMA_VERSION,
    createdAt,
    updatedAt: nowIso(),
    flow,
  };

  localStorage.setItem(key, JSON.stringify(pack));
  const ids = readIndex();
  ids.push(id);
  writeIndex(ids);

  return pack;
}

export function loadFlow(id) {
  const raw = localStorage.getItem(KEY_PREFIX + id);
  if (!raw) return null;
  const pack = safeParse(raw, null);
  if (!pack?.flow) return null;
  return migrateFlow(pack.flow);
}

export function deleteFlow(id) {
  localStorage.removeItem(KEY_PREFIX + id);

  const ids = readIndex().filter((x) => x !== id);
  writeIndex(ids);

  // also remove snapshots (optional)
  localStorage.removeItem(SNAP_PREFIX + id);
}

export function exportFlowJson(id) {
  const flow = loadFlow(id);
  if (!flow) return null;
  return JSON.stringify(flow, null, 2);
}

export function importFlowJson(jsonString) {
  const flowLike = safeParse(jsonString, null);
  if (!flowLike) throw new Error("Invalid JSON");
  const flow = migrateFlow(flowLike);
  saveFlow(flow, { title: flowLike.title });
  return flow;
}

/**
 * Snapshots: store engine runtime vars for a flow id
 */
export function saveSnapshot(flowId, snapshot) {
  const key = SNAP_PREFIX + flowId;
  const pack = {
    flowId,
    savedAt: nowIso(),
    snapshot,
  };
  localStorage.setItem(key, JSON.stringify(pack));
  return pack;
}

export function loadSnapshot(flowId) {
  const raw = localStorage.getItem(SNAP_PREFIX + flowId);
  if (!raw) return null;
  const pack = safeParse(raw, null);
  return pack?.snapshot ?? null;
}

/**
 * Migrations: allow schema to evolve without breaking old saved flows.
 */
export function migrateFlow(flowLike) {
  const f = ensureSchema(flowLike);

  // If you introduce v2 later, add:
  // if (f.schemaVersion === 1) return migrateV1toV2(f);
  // and so on.
  if (!f.schemaVersion) f.schemaVersion = FLOW_SCHEMA_VERSION;

  return f;
}
