const listeners = new Set();

export function subscribeOverlay(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event) {
  listeners.forEach((fn) => fn(event));
}

export const EVT = {
  MODAL_SHOW: "modal:show",
  MODAL_HIDE: "modal:hide",
  TOAST: "toast",
  LOADING_SHOW: "loading:show",
  LOADING_HIDE: "loading:hide",
  EFFECT: "effect",

  STICKER_SPAWN: "sticker:spawn",
  STICKER_CLEAR: "sticker:clear",
  STICKER_BURST: "sticker:burst",
};

export const overlay = {
  showModal(payload) {
    emit({ type: EVT.MODAL_SHOW, payload });
  },
  hideModal(id) {
    emit({ type: EVT.MODAL_HIDE, id });
  },

  toast(payload) {
    emit({ type: EVT.TOAST, payload });
  },

  showLoading(payload) {
    emit({ type: EVT.LOADING_SHOW, payload });
  },
  hideLoading() {
    emit({ type: EVT.LOADING_HIDE });
  },

  effect(payload) {
    emit({ type: EVT.EFFECT, payload });
  },

  // Stickers (BUS EVENTS, not window events)
  spawnSticker(spec) {
    emit({ type: EVT.STICKER_SPAWN, payload: spec || {} });
  },
  clearStickers() {
    emit({ type: EVT.STICKER_CLEAR, payload: {} });
  },
  spawnBurst(spec) {
    emit({ type: EVT.STICKER_BURST, payload: spec || {} });
  },
};
