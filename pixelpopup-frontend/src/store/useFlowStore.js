import { create } from "zustand";

const LS_KEY = "pp_flows_v1";

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export const useFlowsStore = create((set, get) => {
  const boot = safeParse(localStorage.getItem(LS_KEY), {
    flowsById: {},
    activeFlowId: null,
  });

  const persist = (next) => {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return next;
  };

  return {
    flowsById: boot.flowsById || {},
    activeFlowId: boot.activeFlowId || null,

    setActiveFlow(id) {
      const s = get();
      set(persist({ ...s, activeFlowId: id }));
    },

    upsertFlow(flow) {
      const s = get();
      const flowsById = { ...s.flowsById, [flow.id]: flow };
      set(persist({ ...s, flowsById }));
    },

    deleteFlow(id) {
      const s = get();
      const flowsById = { ...s.flowsById };
      delete flowsById[id];
      const activeFlowId = s.activeFlowId === id ? null : s.activeFlowId;
      set(persist({ ...s, flowsById, activeFlowId }));
    },

    getFlow(id) {
      return get().flowsById[id] || null;
    },

    exportFlow(id) {
      const f = get().flowsById[id];
      if (!f) return null;
      return JSON.stringify(f, null, 2);
    },

    importFlow(json) {
      const flow = safeParse(json, null);
      if (!flow?.id || !flow?.nodes || !flow?.start) {
        throw new Error("Invalid flow JSON (missing id/start/nodes).");
      }
      get().upsertFlow(flow);
      return flow.id;
    },
  };
});
