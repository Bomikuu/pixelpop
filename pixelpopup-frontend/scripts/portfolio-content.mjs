import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { projects, experience, portfolioIntroduction } from "../src/pages/portfolio/portfolioData.js";
import { dineEaseProject } from "../src/pages/portfolio/dineease/dineeaseData.js";
import { pixelCoreProject } from "../src/pages/portfolio/pixelcore/pixelcoreData.js";
import { portfolioServiceCatalog } from "../src/pages/portfolio/services/portfolioServices.js";

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const paragraph = (text) => `<p>${escapeHtml(text)}</p>`;
const list = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
const link = (href, label) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
const section = (id, title, body) => `<section id="${id}"><h2>${escapeHtml(title)}</h2>${body}</section>`;

function articleLinks(articles) {
  return articles.map((article) => `<article><h3>${link(`/portfolio/articles/${encodeURIComponent(article.slug)}`, article.title)}</h3>${paragraph(article.excerpt)}</article>`).join("");
}

function projectContent(project) {
  return section("overview", project.overview.title, paragraph(project.overview.description))
    + section("responsibilities", project.responsibilities.title,
      paragraph(project.responsibilities.description)
      + project.responsibilities.items.map((item) => `<article><h3>${escapeHtml(item.title)}</h3>${paragraph(item.summary)}${list(item.features)}</article>`).join(""))
    + section("project-context", "Project context", list(project.hero.facts.map((fact) => `${fact.label}: ${fact.value}. ${fact.detail}`)))
    + section("technology", project.technology.title, paragraph(project.technology.description) + list(project.technology.items.map((item) => `${item.name}: ${item.detail}`)));
}

// Visible HTML for readers and crawlers before React loads, using the same
// project records as the interactive pages. No user-agent-specific content.
export function createPortfolioContent(articles) {
  const content = new Map();
  const home = section("about", "About me", paragraph(portfolioIntroduction.approach))
    + section("work", "Selected project work", projects.map((project) =>
      `<article id="project-${project.id}"><h3>${escapeHtml(project.title)}</h3>${paragraph(project.summary)}${paragraph(`My role: ${project.role}`)}${list(project.outcomes)}${project.link ? paragraphLink(project.link, project.linkLabel) : ""}</article>`).join(""))
    + section("experience", "Work history", experience.map((item) => `<article><h3>${escapeHtml(item.company)}</h3>${paragraph(`${item.title} · ${item.period}`)}${paragraph(item.detail)}</article>`).join(""))
    + section("articles", "Articles and notes", articleLinks(articles) + paragraphLink("/portfolio/articles", "View all articles"))
    + section("contact", "Discuss your project", paragraphLink("mailto:mico.dahang@gmail.com", "Email Mico Ang"));
  content.set("/", home);
  content.set("/portfolio", home);
  content.set("/portfolio/articles", section("articles", "Published articles", articleLinks(articles)));

  for (const article of articles) {
    const body = article.content ? renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, article.content)) : "";
    content.set(`/portfolio/articles/${article.slug}`, `<article>${paragraph(`Written by ${article.author || "Mico Ang"}`)}${body}</article>${paragraphLink("/portfolio/articles", "All articles")}`);
  }
  for (const project of [dineEaseProject, pixelCoreProject]) {
    content.set(`/portfolio/${project.slug}`, projectContent(project));
  }
  content.set("/portfolio/services", section("services", "Development services", portfolioServiceCatalog.map((service) => `<article><h3>${link(`/portfolio/services/${service.slug}`, service.title)}</h3>${paragraph(service.summary)}</article>`).join("")));
  return content;
}

function paragraphLink(href, label) {
  return `<p>${link(href, label)}</p>`;
}
