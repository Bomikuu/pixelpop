import { useCallback, useEffect, useRef, useState } from "react";
import { financeApi } from "../api";

// The mobile entry route does not need the dashboard's reports or reminders.
export function useQuickEntryData() {
  const token = useRef("");
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const request = useCallback((path, options) => financeApi(path, options, token.current), []);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const session = await request("session/", { signal: controller.signal });
        token.current = session.csrfToken;
        const [accounts, categories, unsettled] = await Promise.all([
          request("accounts/?page_size=100", { signal: controller.signal }),
          request("categories/?page_size=100", { signal: controller.signal }),
          request("transactions/unsettled/?page_size=1", { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) setState({ status: "ready", error: "", data: {
          accounts: accounts.results, categories: categories.results, user: session.user, unsettledCount: unsettled.count,
        } });
      } catch (error) {
        if (!controller.signal.aborted) setState((previous) => ({ ...previous,
          status: previous.data ? "ready" : [401, 403].includes(error.status) ? "denied" : "error",
          error: error.message,
        }));
      }
    }
    load();
    return () => controller.abort();
  }, [request, version]);
  return { ...state, request, refresh, version };
}
