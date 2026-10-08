// The business workspace uses the existing shared Django session and CSRF endpoint.
let tokenPromise;
async function csrfToken() {
  if (!tokenPromise) tokenPromise = fetch("/api/v1/finance/session/", { credentials: "same-origin", cache: "no-store" })
    .then(async (response) => {
      const session = await response.json();
      if (!response.ok || !session?.csrfToken) throw new Error("Sign in again to use your application workspace.");
      return session.csrfToken;
    }).catch((error) => { tokenPromise = null; throw error; });
  return tokenPromise;
}

export async function jobApi(path, { method = "GET", body, signal, download = false } = {}) {
  const token = method === "GET" ? "" : await csrfToken();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 110000);
  try {
    const multipart = body instanceof FormData;
    const response = await fetch(`/api/v1/job-applications/${path}`, {
      method, credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { Accept: "application/json", ...(token ? { "X-CSRFToken": token } : {}), ...(body && !multipart ? { "Content-Type": "application/json" } : {}) },
      body: body ? multipart ? body : JSON.stringify(body) : undefined,
    });
    if (response.ok && download) return { blob: await response.blob(), filename: response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "application.docx" };
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if ([401, 403].includes(response.status)) tokenPromise = null;
      const error = new Error(typeof data?.detail === "string" ? data.detail : Array.isArray(data) ? data.join(" ") : "Could not complete this action. Review the highlighted fields or try again.");
      error.fields = data; error.status = response.status; throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted) throw new Error("Generation may still be running. Refresh to check saved drafts before retrying.");
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener("abort", abort); }
}

export function downloadFile({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const statuses = ["draft", "ready", "applied", "interviewing", "offer", "rejected", "withdrawn"];
export const packageKinds = ["assessment", "resume", "cover_letter", "answers"];
export const labels = { assessment: "Fit assessment", resume: "Tailored résumé", cover_letter: "Cover letter", answers: "Screening answers", interview_prep: "Interview preparation" };
export const isResumeReport = (mode) => ["discover", "check"].includes(mode);
export const generationLabel = (kind, mode) => ({ discover: "Keyword opportunities", tailor: "Role-tailored résumé proposal", fix: "One-pass checklist fix proposal", check: "Final recruiter check", experience: "Experience suggestions" }[mode] || labels[kind]);
export const fieldError = (errors, key) => Array.isArray(errors?.[key]) ? errors[key].join(" ") : typeof errors?.[key] === "string" ? errors[key] : "";

export function focusInvalidField(form) {
  requestAnimationFrame(() => {
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid?.isConnected) {
      const control = invalid.matches("input, textarea, button, select") ? invalid : invalid.querySelector("input, textarea, button, select");
      control?.focus();
    }
  });
}
