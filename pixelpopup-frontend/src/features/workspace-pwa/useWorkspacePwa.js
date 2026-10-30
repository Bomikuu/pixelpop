import { useEffect, useSyncExternalStore } from "react";
import { useSiteTheme } from "../../ui/theme/SiteTheme";

const initial = { canInstall: false, installing: false, installed: false, updateAvailable: false, online: true, error: "" };
let state = initial;
let installPrompt = null;
let registrationPromise;
let stopListening;
let generation = 0;
const listeners = new Set();
const read = () => state;
function update(patch) {
  const next = { ...state, ...patch };
  if (Object.keys(next).every((key) => next[key] === state[key])) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function start() {
  const current = ++generation;
  const standalone = window.matchMedia("(display-mode: standalone)");
  const installed = () => standalone.matches || navigator.standalone === true;
  const syncDisplay = () => update({ installed: installed(), canInstall: Boolean(installPrompt) && !installed() });
  const connection = () => update({ online: navigator.onLine });
  const beforeInstall = (event) => {
    event.preventDefault(); installPrompt = event;
    update({ canInstall: !installed(), error: "" });
  };
  const appInstalled = () => { installPrompt = null; update({ installed: true, canInstall: false, installing: false }); };
  standalone.addEventListener("change", syncDisplay);
  window.addEventListener("beforeinstallprompt", beforeInstall);
  window.addEventListener("appinstalled", appInstalled);
  window.addEventListener("online", connection);
  window.addEventListener("offline", connection);
  syncDisplay(); connection();
  let registration;
  let worker;
  const workerChanged = () => { if (current === generation) update({ updateAvailable: Boolean(registration?.waiting) }); };
  const watchWorker = () => {
    worker?.removeEventListener("statechange", workerChanged);
    worker = registration.installing;
    worker?.addEventListener("statechange", workerChanged);
    workerChanged();
  };
  if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
    registrationPromise ||= navigator.serviceWorker.register("/workspace-sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      registrationPromise = null;
      throw error;
    });
    registrationPromise.then((result) => {
      if (current !== generation) return;
      registration = result;
      update({ error: "" });
      registration.addEventListener("updatefound", watchWorker);
      watchWorker();
    }).catch(() => {
      if (current === generation) update({ error: "Offline support could not start. You can keep using the workspace online." });
    });
  }
  return () => {
    generation += 1;
    standalone.removeEventListener("change", syncDisplay);
    window.removeEventListener("beforeinstallprompt", beforeInstall);
    window.removeEventListener("appinstalled", appInstalled);
    window.removeEventListener("online", connection);
    window.removeEventListener("offline", connection);
    registration?.removeEventListener("updatefound", watchWorker);
    worker?.removeEventListener("statechange", workerChanged);
  };
}

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) stopListening = start();
  return () => { listeners.delete(listener); if (!listeners.size) { stopListening?.(); stopListening = null; } };
}

async function install() {
  if (!installPrompt || state.installing) return;
  const prompt = installPrompt;
  installPrompt = null;
  update({ installing: true, canInstall: false, error: "" });
  try { await prompt.prompt(); await prompt.userChoice; }
  catch { update({ error: "Installation could not open. Use your browser’s Install or Add to Home Screen option." }); }
  finally { update({ installing: false }); }
}

function attachMetadata(mode) {
  const records = [
    ["link", 'link[rel="manifest"]', { rel: "manifest", href: "/workspace.webmanifest" }],
    ["link", 'link[rel="apple-touch-icon"]', { rel: "apple-touch-icon", href: "/workspace-icons/apple-touch-icon-180.png" }],
    ["meta", 'meta[name="theme-color"]', { name: "theme-color", content: mode === "dark" ? "#000000" : "#2f5bff" }],
    ["meta", 'meta[name="apple-mobile-web-app-title"]', { name: "apple-mobile-web-app-title", content: "Workspace" }],
  ].map(([tag, selector, attributes]) => {
    const existing = document.head.querySelector(selector);
    const element = existing || document.createElement(tag);
    const previous = Object.fromEntries(Object.keys(attributes).map((key) => [key, element.getAttribute(key)]));
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (!existing) document.head.appendChild(element);
    return { element, existing, previous };
  });
  return () => records.forEach(({ element, existing, previous }) => {
    if (!existing) element.remove();
    else Object.entries(previous).forEach(([key, value]) => { if (value === null) element.removeAttribute(key); else element.setAttribute(key, value); });
  });
}

export default function useWorkspacePwa() {
  const { mode } = useSiteTheme();
  const snapshot = useSyncExternalStore(subscribe, read, () => initial);
  useEffect(() => attachMetadata(mode), [mode]);
  return { ...snapshot, install };
}
