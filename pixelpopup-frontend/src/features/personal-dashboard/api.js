export async function financeApi(path, options = {}, csrf = "") {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const timeout = setTimeout(cancel, options.download ? 150000 : 20000);
  try {
    const response = await fetch("/api/v1/finance/" + path, {
      ...options,
      signal: controller.signal,
      credentials: options.credentials || "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(csrf ? { "X-CSRFToken": csrf } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (response.ok && options.download) {
      return {
        blob: await response.blob(),
        filename:
          response.headers
            .get("Content-Disposition")
            ?.match(/filename="([^"]+)"/)?.[1] ||
          "pixelpop-full-database.backup",
      };
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(
        data?.detail ||
          (Array.isArray(data)
            ? data.join(" ")
            : "Could not save or load this information. Please try again."),
      );
      error.status = response.status;
      error.fields = data;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && !options.signal?.aborted)
      throw new Error(
        options.download
          ? "The backup download timed out. Please try again."
          : "The request timed out. Retry with the same form; duplicate payments are protected.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", cancel);
  }
}
