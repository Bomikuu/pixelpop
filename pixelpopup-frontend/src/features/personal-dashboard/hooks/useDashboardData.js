import { useCallback, useEffect, useRef, useState } from "react";
import { financeApi } from "../api";

export function useDashboardData(month) {
  const token = useRef("");
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const request = useCallback(async (path, options) => {
    try {
      return await financeApi(path, options, token.current);
    } catch (error) {
      if ([401, 403].includes(error.status)) {
        token.current = "";
        setState({ status: "denied", data: null, error: "" });
      }
      throw error;
    }
  }, []);
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const session = await request("session/", {
          signal: controller.signal,
        });
        token.current = session.csrfToken;
        const [overview, accounts, categories, settings] = await Promise.all([
          request("overview/?month=" + month, { signal: controller.signal }),
          request("accounts/?page_size=100", { signal: controller.signal }),
          request("categories/?page_size=100", { signal: controller.signal }),
          request("settings/", { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted)
          setState({
            status: "ready",
            data: {
              overview,
              accounts: accounts.results,
              categories: categories.results,
              settings,
              user: session.user,
            },
            error: "",
          });
      } catch (error) {
        if (controller.signal.aborted || [401, 403].includes(error.status))
          return;
        setState({ status: "error", data: null, error: error.message });
      }
    };
    load();
    return () => controller.abort();
  }, [month, request, version]);
  const mutate = useCallback(
    async (path, body, method = "POST") => {
      const result = await request(path, { method, body });
      refresh();
      return result;
    },
    [request, refresh],
  );
  return {
    ...state,
    status:
      state.status === "ready" && state.data.overview.selected_month !== month
        ? "loading"
        : state.status,
    request,
    mutate,
    refresh,
    version,
  };
}

export function useRecords(path, request, version) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  useEffect(() => {
    const controller = new AbortController();
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ path, data, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, data: null, error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [path, request, version]);
  return state.path === path ? state : { data: null, error: "", loading: true };
}
