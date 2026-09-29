const API_ROOT = "/api/v1/leadership/";

function messageFor(data) {
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "object" && data) {
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`)
      .join(" · ");
  }
  return "The request could not be completed. Please try again.";
}

export async function leadershipApi(path, options = {}, csrf = "") {
  const response = await fetch(API_ROOT + path, {
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
    const error = new Error(messageFor(data));
    error.status = response.status;
    error.fields = data;
    throw error;
  }
  return data;
}

export async function allRecords(resource, csrf = "") {
  let page = 1;
  const records = [];
  while (true) {
    const data = await leadershipApi(`${resource}/?page=${page}&page_size=100`, {}, csrf);
    if (Array.isArray(data)) return data;
    records.push(...data.results);
    if (!data.next) return records;
    page += 1;
  }
}
