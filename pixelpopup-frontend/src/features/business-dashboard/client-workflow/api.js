const ROOT = "/api/v1/client-workflow/";

function errorMessage(data) {
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") return Object.entries(data).map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : value}`).join(" · ");
  return "This change could not be saved. Please try again.";
}

export async function workflowApi(path, options = {}, csrf = "") {
  const response = await fetch(ROOT + path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(errorMessage(data));
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function workflowRecords(resource, params = {}, csrf = "") {
  let page = 1;
  const records = [];
  while (true) {
    const query = new URLSearchParams({ ...params, page: String(page), page_size: "100" });
    const data = await workflowApi(`${resource}/?${query}`, {}, csrf);
    if (Array.isArray(data)) return data;
    records.push(...data.results);
    if (!data.next) return records;
    page += 1;
  }
}
