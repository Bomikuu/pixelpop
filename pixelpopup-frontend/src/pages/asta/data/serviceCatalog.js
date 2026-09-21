import aiAutomation from "./services/ai_automation.json";
import bugFixing from "./services/bug_fixing_responsiveness.json";
import cmsSolutions from "./services/cms_solutions.json";
import maintenance from "./services/website_maintenance_security.json";
import optimization from "./services/speed_optimization_seo.json";
import threejsDevelopment from "./services/threejs_development.json";
import websiteDesign from "./services/website_design.json";
import websiteDevelopment from "./services/website_development.json";

export const serviceCatalog = [
  threejsDevelopment,
  aiAutomation,
  websiteDesign,
  websiteDevelopment,
  cmsSolutions,
  bugFixing,
  maintenance,
  optimization,
].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.order - b.order);

export const dropdownServices = [
  ...serviceCatalog.filter((service) => service.featured),
  ...serviceCatalog.filter((service) => !service.featured).slice(0, 4),
];

export function getServiceHref(service) {
  return `/asta/services/${service.slug}`;
}

export function getServiceBySlug(slug) {
  return serviceCatalog.find((service) => service.slug === slug);
}
