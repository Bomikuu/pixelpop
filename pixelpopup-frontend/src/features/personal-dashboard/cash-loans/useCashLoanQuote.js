import { useEffect, useState } from "react";
import { cashLoanApi } from "./api";

export default function useCashLoanQuote({ request, terms, enabled = true }) {
  const fingerprint = JSON.stringify(terms);
  const [state, setState] = useState({ fingerprint: "", quote: null, errors: {}, loading: false });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ fingerprint, quote: null, errors: {}, loading: true });
    const timer = setTimeout(() => {
      cashLoanApi(request).quote(JSON.parse(fingerprint), controller.signal).then((quote) => {
        if (!controller.signal.aborted) setState({ fingerprint, quote, errors: {}, loading: false });
      }).catch((error) => {
        if (!controller.signal.aborted) setState({ fingerprint, quote: null, errors: error.fields || { detail: error.message }, loading: false });
      });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [fingerprint, enabled, request]);
  const current = enabled && state.fingerprint === fingerprint && !!state.quote && !state.loading;
  return { ...state, current, quote: current ? state.quote : null, loading: enabled && (state.fingerprint !== fingerprint || state.loading) };
}
