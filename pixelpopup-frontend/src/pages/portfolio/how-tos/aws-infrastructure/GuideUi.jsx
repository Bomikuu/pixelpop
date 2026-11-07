import { Activity, ArrowUpRight, Cpu, Database, FolderOpen, Globe, KeyRound, ListOrdered, Radio, Server, ShieldCheck, Signpost, Waypoints, Workflow, Zap } from "lucide-react";

const icons = { Activity, Cpu, Database, FolderOpen, Globe, KeyRound, ListOrdered, Radio, Server, ShieldCheck, Signpost, Waypoints, Workflow, Zap };

export function GuideIcon({ name, size = 22, ...props }) {
  const Icon = icons[name] || Server;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}

export function ServiceLogo({ id, size = 32 }) {
  return <img className="aws-service-logo" src={`/portfolio/assets/how-tos/aws-infrastructure/icons/${id}.svg`} width={size} height={size} alt="" loading="lazy" decoding="async" />;
}

export function SourceLink({ href, children }) {
  return <a className="aws-source-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
}
