// src/engine/authoring/flowSchema.js

export const FLOW_SCHEMA_VERSION = 1;

/**
 * Authoring JSON shape (stable)
 * {
 *   schemaVersion: 1,
 *   id: "flow-id",
 *   start: "nodeId",
 *   nodes: {
 *     nodeId: {
 *       scene: "TypewriterPanel" | "ChoicePanel" | ...,
 *       props: {...},
 *       mutations?: [...],
 *       on?: { [eventName]: transition | transition[] },
 *       default?: transition | transition[],
 *     }
 *   }
 * }
 *
 * transition:
 *  "nodeId"
 *  OR { to: "nodeId", when?: {var, eq|gte|lte|...}, mutations?: [...] }
 */

export function ensureSchema(flowLike) {
  if (!flowLike) throw new Error("Flow is required");

  // Allow your runtime flow format (megaDemoFlow) OR authored format.
  const schemaVersion =
    Number(flowLike.schemaVersion ?? flowLike.version ?? FLOW_SCHEMA_VERSION) || FLOW_SCHEMA_VERSION;

  const id = String(flowLike.id || "untitled");
  const start = String(flowLike.start || "start");
  const nodes = flowLike.nodes || {};

  if (!nodes || typeof nodes !== "object") throw new Error("Flow.nodes must be an object");

  return {
    schemaVersion,
    id,
    start,
    nodes,
  };
}

/**
 * Minimal validation: ensures start exists, nodes valid enough.
 * Returns { ok, errors[] }
 */
export function validateFlow(flowLike) {
  const errors = [];
  let f;
  try {
    f = ensureSchema(flowLike);
  } catch (e) {
    return { ok: false, errors: [String(e?.message || e)] };
  }

  if (!f.nodes[f.start]) errors.push(`start node "${f.start}" not found in nodes`);

  for (const [nodeId, node] of Object.entries(f.nodes)) {
    if (!node || typeof node !== "object") {
      errors.push(`node "${nodeId}" must be an object`);
      continue;
    }
    if (!node.scene && !node.type) errors.push(`node "${nodeId}" missing scene`);
  }

  return { ok: errors.length === 0, errors };
}
