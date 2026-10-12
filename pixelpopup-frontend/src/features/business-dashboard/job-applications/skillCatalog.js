import { Code2, Layers, Server, Workflow } from "lucide-react";

export const skillGroups = [
  { label: "Frontend", prefix: "Frontend skill", icon: Code2, options: ["React", "Vue", "Nuxt", "Next.js", "JavaScript", "TypeScript", "Tailwind CSS", "Svelte", "SvelteKit", "Angular", "Redux Toolkit", "RTK Query", "Pinia", "Accessibility", "React Testing Library", "Playwright"] },
  { label: "Backend", prefix: "Backend skill", icon: Server, options: ["Django", "Python", "Django REST Framework", "Node.js", "Express", "PostgreSQL", "MySQL", "REST APIs", "Redis", "Celery", "FastAPI", "Go", "Java", "Spring Boot", "GraphQL", "WebSockets"] },
  { label: "DevOps", prefix: "DevOps skill", icon: Workflow, options: ["Docker", "Linux", "Nginx", "CI/CD", "AWS", "Vercel", "Netlify", "Database migrations", "GitHub Actions", "Database backups", "Monitoring", "SSH", "SSL/TLS", "Terraform", "Kubernetes"] },
  { label: "System types", prefix: "System experience", icon: Layers, options: ["Custom CMS websites", "Inventory systems", "Point-of-sale systems", "Restaurant systems", "Local-business landing pages", "Full-stack applications", "E-commerce", "Booking systems", "API integrations", "Role-based access control"] },
];
