import { dineEaseProject } from "../dineease/dineeaseData";

export const portfolioProjects = [dineEaseProject];

export function getPortfolioProject(slug) {
  return portfolioProjects.find((project) => project.slug === slug);
}
