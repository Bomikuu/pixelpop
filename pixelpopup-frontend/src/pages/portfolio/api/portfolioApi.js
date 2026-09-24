const DEFAULT_API_ORIGIN = "http://localhost:8000";
const apiOrigin = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN).replace(/\/$/, "");
const portfolioApiBase = `${apiOrigin}/api/v1/portfolio`;

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = new Error(`Portfolio API request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function getArticles({ page = 1, search = "", category = "" } = {}, signal) {
  const params = new URLSearchParams({ page: String(page) });
  if (search.trim()) params.set("search", search.trim());
  if (category) params.set("category__slug", category);
  return requestJson(`${portfolioApiBase}/articles/?${params}`, { signal });
}

export function getArticleCategories(signal) {
  return requestJson(`${portfolioApiBase}/articles/categories/`, { signal });
}

export function getArticle(slug, signal) {
  return requestJson(`${portfolioApiBase}/articles/${encodeURIComponent(slug)}/`, { signal });
}

export function getCoverLetter(slug, signal) {
  return requestJson(`${portfolioApiBase}/cover-letters/${encodeURIComponent(slug)}/`, { signal });
}

export function getCoverLetterDownloadUrl(slug) {
  return `${portfolioApiBase}/cover-letters/${encodeURIComponent(slug)}/download/`;
}

export function getGithubActivity(year, signal) {
  return requestJson(`${portfolioApiBase}/activity/github/?year=${encodeURIComponent(year)}`, { signal });
}
