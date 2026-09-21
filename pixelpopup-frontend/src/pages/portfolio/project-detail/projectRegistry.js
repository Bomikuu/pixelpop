import { dineEaseProject } from "../dineease/dineeaseData";
import { pixelCoreProject } from "../pixelcore/pixelcoreData";

export const portfolioProjects = [dineEaseProject, pixelCoreProject];

export function getPortfolioProject(slug) {
  return portfolioProjects.find((project) => project.slug === slug);
}
