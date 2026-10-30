import { useCallback, useEffect, useRef, useState } from "react";
import { financeApi } from "../api";

export function useDashboardData(month) {
  const token = useRef("");
  const references = useRef({});
  const referenceUser = useRef(null);
  const activeLoad = useRef(null);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
    refreshError: "",
    refreshing: false,
    updatedAt: null,
  });
  const request = useCallback(async (path, options) => {
    try {
      return await financeApi(path, options, token.current);
    } catch (error) {
      if ([401, 403].includes(error.status)) {
        let expired = path === "session/";
        if (!expired) {
          try {
            const session = await financeApi("session/");
            token.current = session.csrfToken;
            expired = referenceUser.current !== null && session.user.id !== referenceUser.current;
          } catch (verificationError) {
            expired = [401, 403].includes(verificationError.status);
          }
        }
        if (expired) {
          token.current = "";
          references.current = {};
          referenceUser.current = null;
          setState({ status: "denied", data: null, error: "", refreshError: "", refreshing: false, updatedAt: null });
        }
      }
      throw error;
    }
  }, []);
  const refresh = useCallback((options) => {
    const resources = options?.resources;
    if (Array.isArray(resources)) {
      for (const resource of resources) delete references.current[resource];
    } else references.current = {};
    setVersion((n) => n + 1);
  }, []);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible" && !activeLoad.current) refresh({ resources: ["accounts"] });
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    activeLoad.current = controller;
    const load = async () => {
      setState((previous) => ({ ...previous, status: previous.data ? "ready" : "loading", refreshing: true, refreshError: "" }));
      try {
        const session = await request("session/", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (referenceUser.current !== session.user.id) {
          references.current = {};
          if (referenceUser.current !== null) {
            setState({ status: "loading", data: null, error: "", refreshError: "", refreshing: true, updatedAt: null });
          }
          referenceUser.current = session.user.id;
        }
        token.current = session.csrfToken;
        const loadReference = async (resource, fetchData) => {
          const cached = references.current[resource];
          if (cached && Date.now() - cached.updatedAt < 5 * 60 * 1000) return cached.data;
          const data = await fetchData();
          if (!controller.signal.aborted) references.current[resource] = { data, updatedAt: Date.now() };
          return data;
        };
        const loadPages = async (resource) => {
          const rows = [];
          let page = 1;
          let response;
          do {
            response = await request(resource + "/?page_size=100&page=" + page, {
              signal: controller.signal,
              timeoutMs: 90000,
            });
            rows.push(...response.results);
            page += 1;
          } while (response.next);
          return { ...response, results: rows, next: null, previous: null };
        };
        const [overview, accounts, categories, settings, contacts] = await Promise.all([
          request("overview/?month=" + month, { signal: controller.signal, timeoutMs: 90000 }),
          loadReference("accounts", () => loadPages("accounts")),
          loadReference("categories", () => loadPages("categories")),
          loadReference("settings", () => request("settings/", { signal: controller.signal })),
          loadReference("contacts", async () => (await loadPages("contacts")).results),
        ]);
        if (!controller.signal.aborted)
          setState((previous) => previous.status === "denied" ? previous : {
            status: "ready",
            data: {
              overview,
              accounts: accounts.results,
              categories: categories.results,
              contacts,
              settings,
              user: session.user,
            },
            error: "",
            refreshError: "",
            refreshing: false,
            updatedAt: Date.now(),
          });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) => previous.status === "denied" ? previous : {
          ...previous,
          status: previous.data ? "ready" : "error",
          error: previous.data ? "" : error.message,
          refreshError: previous.data ? error.message : "",
          refreshing: false,
        });
      } finally {
        if (activeLoad.current === controller) activeLoad.current = null;
      }
    };
    load();
    return () => {
      controller.abort();
      if (activeLoad.current === controller) activeLoad.current = null;
    };
  }, [month, request, version]);
  const mutate = useCallback(
    async (path, body, method = "POST") => {
      const result = await request(path, { method, body });
      const resource = path.split("/")[0];
      const affected = {
        accounts: ["accounts"], assets: ["accounts"], categories: ["categories"],
        contacts: ["contacts"], settings: ["settings"], schedules: [],
        transactions: ["accounts", "contacts"], movements: ["accounts"],
        loans: ["accounts", "contacts"], deadlines: ["accounts"],
      }[resource];
      refresh(affected ? { resources: affected } : undefined);
      return result;
    },
    [request, refresh],
  );
  return {
    ...state,
    monthPending: Boolean(state.data && state.data.overview.selected_month !== month),
    request,
    mutate,
    refresh,
    version,
  };
}

export function useRecords(path, request, version, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: "", loading: true, refreshing: false });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((previous) => previous.path === path && previous.data
      ? { ...previous, error: "", loading: false, refreshing: true }
      : { path, data: null, error: "", loading: true, refreshing: false });
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ path, data, error: "", loading: false, refreshing: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState((previous) => ({ path, data: previous.path === path ? previous.data : null, error: error.message, loading: false, refreshing: false }));
      });
    return () => controller.abort();
  }, [path, request, version, enabled]);
  if (!enabled) return { data: null, error: "", loading: false, refreshing: false };
  return state.path === path ? state : { data: null, error: "", loading: true, refreshing: false };
}
