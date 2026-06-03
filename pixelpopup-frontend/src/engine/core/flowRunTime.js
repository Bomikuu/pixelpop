// src/engine/core/flowRuntime.js
function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function getByPath(obj, path) {
  if (!path) return obj;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(obj, path, value) {
  const parts = String(path).split(".");
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (!isObj(cur[p])) cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
  return obj;
}

function unsetByPath(obj, path) {
  const parts = String(path).split(".");
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (!isObj(cur[p])) return obj;
    cur = cur[p];
  }
  if (cur && Object.prototype.hasOwnProperty.call(cur, last)) delete cur[last];
  return obj;
}

function resolveTokensDeep(value, ctx) {
  // simple token resolver: {{vars.x}} and {{now}}
  if (typeof value === "string") {
    return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
      const e = String(expr).trim();
      if (e === "now") return String(Date.now());
      const v = e.startsWith("vars.")
        ? getByPath(ctx, e)
        : getByPath(ctx, e);
      return v == null ? "" : String(v);
    });
  }
  if (Array.isArray(value)) return value.map((x) => resolveTokensDeep(x, ctx));
  if (isObj(value)) {
    const out = {};
    for (const k of Object.keys(value)) out[k] = resolveTokensDeep(value[k], ctx);
    return out;
  }
  return value;
}

export function applyMutations(state, mutations, extras = {}) {
  if (!Array.isArray(mutations) || mutations.length === 0) return state;

  // shallow clone + clone vars (most common)
  const next = { ...state, vars: { ...(state.vars || {}) } };
  const ctx = { ...next, ...extras };

  for (const m of mutations) {
    if (!m || !m.type) continue;

    const type = m.type;
    const path = m.path;

    if (type === "set") {
      setByPath(next, path, resolveTokensDeep(m.value, ctx));
      continue;
    }

    if (type === "merge") {
      const cur = getByPath(next, path);
      const val = resolveTokensDeep(m.value, ctx);
      setByPath(next, path, { ...(isObj(cur) ? cur : {}), ...(isObj(val) ? val : {}) });
      continue;
    }

    if (type === "inc") {
      const cur = Number(getByPath(next, path) ?? 0);
      const by = Number(m.by ?? 1);
      setByPath(next, path, cur + by);
      continue;
    }

    if (type === "toggle") {
      const cur = Boolean(getByPath(next, path));
      setByPath(next, path, !cur);
      continue;
    }

    if (type === "push") {
      const cur = getByPath(next, path);
      const arr = Array.isArray(cur) ? cur.slice() : [];
      arr.push(resolveTokensDeep(m.value, ctx));
      setByPath(next, path, arr);
      continue;
    }

    if (type === "removeAt") {
      const cur = getByPath(next, path);
      if (!Array.isArray(cur)) continue;
      const idx = Number(m.index ?? -1);
      if (idx < 0 || idx >= cur.length) continue;
      const arr = cur.slice();
      arr.splice(idx, 1);
      setByPath(next, path, arr);
      continue;
    }

    if (type === "unset") {
      unsetByPath(next, path);
      continue;
    }
  }

  return next;
}

export function evalWhen(when, state) {
  if (!when) return true;
  if (typeof when === "boolean") return when;

  if (when.all) return Array.isArray(when.all) && when.all.every((c) => evalWhen(c, state));
  if (when.any) return Array.isArray(when.any) && when.any.some((c) => evalWhen(c, state));
  if (when.not) return !evalWhen(when.not, state);

  const varName = when.var;
  const val = (state.vars || {})[varName];

  if ("exists" in when) {
    const want = Boolean(when.exists);
    const has = val !== undefined;
    return want ? has : !has;
  }

  if ("eq" in when) return val === when.eq;
  if ("ne" in when) return val !== when.ne;

  const num = Number(val);
  if ("gt" in when) return num > Number(when.gt);
  if ("gte" in when) return num >= Number(when.gte);
  if ("lt" in when) return num < Number(when.lt);
  if ("lte" in when) return num <= Number(when.lte);

  if ("in" in when) return Array.isArray(when.in) && when.in.includes(val);

  if ("contains" in when) {
    const c = when.contains;
    if (typeof val === "string") return val.includes(String(c));
    if (Array.isArray(val)) return val.includes(c);
    return false;
  }

  return false;
}

export function pickTransition(routeDef, state) {
  // routeDef can be:
  // - "nodeId"
  // - { to, when, mutations }
  // - [ { to, when, mutations }, ... ]
  if (!routeDef) return null;

  if (typeof routeDef === "string") return { to: routeDef };

  if (Array.isArray(routeDef)) {
    for (const r of routeDef) {
      if (!r) continue;
      if (evalWhen(r.when, state)) return r;
    }
    return null;
  }

  if (routeDef.to) {
    if (evalWhen(routeDef.when, state)) return routeDef;
    return null;
  }

  return null;
}
