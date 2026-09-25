import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { portfolioServiceCatalog } from "../src/pages/portfolio/services/portfolioServices.js";
import { dineEaseProject } from "../src/pages/portfolio/dineease/dineeaseData.js";
import { pixelCoreProject } from "../src/pages/portfolio/pixelcore/pixelcoreData.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
const origin = (process.env.SITE_URL || "https://pixelsbymiku.dev").replace(/\/$/, "");
const portfolioImage = `${origin}/portfolio/assets/mico-ang-portrait.jpg`;
const astaImage = `${origin}/portfolio/assets/asta-team-01.jpg`;
const routes = [];

function add(pathname, title, description, keywords, image = portfolioImage) {
  routes.push({ pathname, title, description, keywords, image });
}

add("/", "Mico Ang | Senior Frontend & Full-Stack Developer", "Portfolio of Mico Ang, a senior frontend engineer, full-stack developer, and technical lead building clear, fast, maintainable products.", "Mico Ang, senior frontend engineer, full-stack developer, React, Vue, Django, technical lead");
add("/portfolio", "Mico Ang | Senior Frontend & Full-Stack Developer", "Portfolio of Mico Ang, a senior frontend engineer, full-stack developer, and technical lead building clear, fast, maintainable products.", "Mico Ang, senior frontend engineer, full-stack developer, React, Vue, Django, technical lead");
add("/portfolio/work-with-me", "Work with Mico Ang | Frontend & Full-Stack Development", "Work with Mico Ang directly or engage ASTA Softwares for frontend leadership, full-stack product delivery, and coordinated software development.", "hire frontend developer, full-stack development, technical leadership, Mico Ang");
add("/portfolio/services", "Web Product Services | Mico Ang", "Explore Mico Ang's services in web development, 3D, AI automation, content systems, performance, technical SEO, and product support.", "web development services, Three.js development, AI automation, technical SEO, Mico Ang");
add("/portfolio/articles", "Articles on Frontend, SEO & AI | Mico Ang", "Practical notes by Mico Ang on frontend systems, web performance, technical SEO, AI, and software delivery.", "frontend engineering articles, technical SEO, web performance, AI development");
add("/portfolio/introduction-letter", "Introduction Letter | Mico Ang", "Read Mico Ang's introduction as a senior frontend engineer, full-stack developer, and technical lead.", "Mico Ang introduction, frontend engineer, technical lead");
add("/portfolio/intro-video", "Intro Video | Mico Ang", "Watch Mico Ang introduce his frontend engineering, full-stack development, and technical leadership work.", "Mico Ang intro video, frontend developer, technical lead");
add("/portfolio/work-setup", "Remote Work Setup | Mico Ang", "Explore the internet connection, workstation, camera, microphone, and peripherals in Mico Ang's remote software development setup.", "remote developer setup, workstation, internet speed, Mico Ang");
add("/portfolio/interview-review", "Interview Review | Mico Ang", "A review of Mico Ang's engineering experience, product work, and technical leadership for interviews.", "frontend engineer interview, Mico Ang, technical leadership");
add("/portfolio/interview-reference", "Interview Reference | Mico Ang", "A practical reference for frontend, backend, system design, SEO, product thinking, and technical leadership interviews.", "frontend interview reference, system design, technical leadership, SEO");
add("/portfolio/ai-prompt-guide", "Efficient AI Prompting | Mico Ang", "An interactive guide to writing specific, bounded AI coding prompts that conserve tokens and avoid unnecessary work.", "AI prompting guide, coding prompts, AI development workflow");
for (const project of [dineEaseProject, pixelCoreProject]) {
  add(`/portfolio/${project.slug}`, project.seo.title, project.seo.description, `${project.name}, software case study, Mico Ang`);
}

for (const service of portfolioServiceCatalog) {
  add(`/portfolio/services/${service.slug}`, `${service.title} | Mico Ang`, service.summary, `${service.title}, web product services, Mico Ang`);
}

add("/asta", "ASTA Softwares | Custom Software and Web Products", "ASTA Softwares designs and builds custom business systems, web products, and operational tools. Established 2021.", "ASTA Softwares, custom software development, web development, business systems", astaImage);
add("/asta/team", "Our Team | ASTA Softwares", "Meet the engineering and product team behind ASTA Softwares, established in 2021.", "ASTA Softwares team, software engineers, product development", astaImage);
add("/asta/services", "Software Development Services | ASTA Softwares", "Explore ASTA Softwares services for custom websites, web apps, 3D, AI automation, CMS, maintenance, and performance.", "ASTA Softwares services, custom software, web development, AI automation", astaImage);

const serviceDir = path.join(root, "src/pages/asta/data/services");
for (const filename of await readdir(serviceDir)) {
  if (!filename.endsWith(".json")) continue;
  const service = JSON.parse(await readFile(path.join(serviceDir, filename), "utf8"));
  add(`/asta/services/${service.slug}`, `${service.title} | ASTA Softwares`, service.summary, `${service.title}, ASTA Softwares, custom software`, astaImage);
}

let articles = JSON.parse(await readFile(path.join(root, "scripts/article-seo-cache.json"), "utf8"));
try {
  const api = (process.env.SEO_ARTICLES_API_URL || "https://pixelpopup-backend.vercel.app/api/v1/portfolio/articles/");
  const response = await fetch(api, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const published = [...(payload.results || [])];
  let next = payload.next;
  while (next) {
    const page = await fetch(next, { signal: AbortSignal.timeout(8000) });
    if (!page.ok) throw new Error(`HTTP ${page.status}`);
    const data = await page.json();
    published.push(...(data.results || []));
    next = data.next;
  }
  articles = published.map((article) => ({
    slug: article.slug,
    title: article.seo_title || article.title,
    excerpt: article.seo_description || article.excerpt,
    category: article.category?.name || "Articles",
    image: article.cover_image_url || portfolioImage,
  }));
} catch (error) {
  console.warn(`Article SEO feed unavailable (${error.message}); using the checked-in article snapshot.`);
}

for (const article of articles) {
  add(`/portfolio/articles/${article.slug}`, `${article.title} | Mico Ang`, article.excerpt, `${article.category}, ${article.title}, Mico Ang`, article.image || portfolioImage);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const template = await readFile(path.join(dist, "index.html"), "utf8");
const fallbackDirectory = path.join(dist, "_fallback");
await mkdir(fallbackDirectory, { recursive: true });
await writeFile(path.join(fallbackDirectory, "index.html"), template);
const fallbackStyles = `<style>
      .seo-fallback{box-sizing:border-box;min-height:100vh;background:#f8fafc;color:#0f172a;font-family:"Instrument Sans",Arial,sans-serif}
      .seo-fallback *{box-sizing:border-box}.seo-fallback header{height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1280px;margin:auto;padding:0 24px;border-bottom:1px solid #e2e8f0}
      .seo-fallback header a{color:inherit;text-decoration:none;font-weight:700}.seo-fallback nav{display:flex;gap:24px;font-size:14px}.seo-fallback main{max-width:1280px;min-height:calc(100vh - 76px);margin:auto;padding:80px 24px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      .seo-fallback h1{max-width:760px;margin:0;font-family:"Saira Condensed",Arial,sans-serif;font-size:clamp(64px,7vw,96px);line-height:.93;letter-spacing:-.04em}
      .seo-fallback h1 span{display:block;color:#2f5bff}.seo-fallback p{max-width:630px;margin:28px 0 0;font-size:clamp(18px,2vw,21px);line-height:1.6;color:#475569}
      .seo-fallback a.seo-fallback-cta{display:inline-block;margin-top:32px;padding:14px 24px;background:#2f5bff;color:white;text-decoration:none;font-weight:700;border-radius:6px}
      .seo-fallback--asta{background:#061427;color:white}.seo-fallback--asta header{border-color:#28415e}.seo-fallback--asta p{color:#bdc9dc}.seo-fallback--asta h1 span{color:#59aaff}
      @media(max-width:640px){.seo-fallback header{height:68px;padding:0 20px}.seo-fallback main{min-height:calc(100vh - 68px);padding:48px 20px}.seo-fallback h1{font-size:clamp(58px,16vw,76px)}.seo-fallback nav{gap:14px}}
    </style>`;
for (const route of routes) {
  const url = `${origin}${route.pathname}`;
  const isAsta = route.pathname.startsWith("/asta");
  const isArticle = route.pathname.includes("/articles/");
  const structuredData = isArticle
    ? { "@context": "https://schema.org", "@type": "Article", headline: route.title.replace(/ \| Mico Ang$/, ""), description: route.description, image: route.image, url, author: { "@type": "Person", name: "Mico Ang" } }
    : isAsta
      ? { "@context": "https://schema.org", "@type": "Organization", name: "ASTA Softwares", url: `${origin}/asta`, image: astaImage, description: route.description }
      : { "@context": "https://schema.org", "@type": "Person", name: "Mico Ang", url: `${origin}${route.pathname === "/" ? "/" : "/portfolio"}`, image: portfolioImage, description: route.description };
  const meta = [
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(route.keywords)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${isArticle ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${isAsta ? "ASTA Softwares" : "Mico Ang Portfolio"}" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(route.image)}" />`,
    `<meta property="og:image:alt" content="${isAsta ? "ASTA Softwares team" : "Mico Ang portfolio"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(route.image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
  const home = route.pathname === "/" || route.pathname === "/portfolio";
  const astaHome = route.pathname === "/asta";
  const fallbackHeading = home ? "Meet <span>Mico Ang.</span>" : astaHome ? "<span>ASTA</span> Softwares" : escapeHtml(route.title.replace(/ \| (Mico Ang|ASTA Softwares)$/, ""));
  const fallbackDescription = home
    ? "Senior frontend engineer, full-stack developer, and technical lead turning complex product requirements into clear, high-performing experiences."
    : astaHome
      ? "We build custom software around real business workflows — helping your team work smarter, move faster, and achieve more."
      : route.description;
  const fallback = `<div class="seo-fallback${isAsta ? " seo-fallback--asta" : ""}"><header><a href="${isAsta ? "/asta" : route.pathname === "/" ? "/" : "/portfolio"}">${isAsta ? "ASTA Softwares" : "Mico Ang"}</a><nav aria-label="Primary"><a href="/portfolio">Portfolio</a><a href="/asta">ASTA</a></nav></header><main><h1>${fallbackHeading}</h1><p>${escapeHtml(fallbackDescription)}</p><a class="seo-fallback-cta" href="${isAsta ? "/asta/services" : "/portfolio/work-with-me"}">${isAsta ? "Explore services" : "Work with me"}</a></main></div>`;
  const html = template
    .replace('<meta name="robots" content="noindex,follow" />', '<meta name="robots" content="index,follow" />')
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace("</head>", `    ${meta}\n    ${fallbackStyles}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  const directory = path.join(dist, route.pathname.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(({ pathname }) => `  <url><loc>${escapeHtml(`${origin}${pathname}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(dist, "sitemap.xml"), sitemap);
console.log(`Generated SEO metadata and sitemap for ${routes.length} public pages.`);
