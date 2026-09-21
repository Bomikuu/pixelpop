export function formatArticleDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function getArticleAuthor(article) {
  return article?.author?.full_name || article?.author_name || "Mico Ang";
}
