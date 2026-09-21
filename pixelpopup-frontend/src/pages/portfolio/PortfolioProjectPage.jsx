import { Navigate, useParams } from "react-router-dom";
import ProjectCaseStudyPage from "./project-detail/ProjectCaseStudyPage";
import { getPortfolioProject } from "./project-detail/projectRegistry";

export default function PortfolioProjectPage() {
  const { projectSlug } = useParams();
  const project = getPortfolioProject(projectSlug);
  if (!project) return <Navigate to="/portfolio" replace />;
  return <ProjectCaseStudyPage project={project} />;
}
