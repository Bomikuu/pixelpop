import {
  Activity,
  Blocks,
  Bot,
  Braces,
  ClipboardCheck,
  Database,
  DatabaseBackup,
  FileSearch,
  Gauge,
  GitBranch,
  LayoutTemplate,
  Link2,
  PackageSearch,
  PanelsTopLeft,
  Route,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";

const inclusionIconRules = [
  [/dependency|plugin|framework|platform update/i, PackageSearch],
  [/security|access|permission|authentication|secrets/i, ShieldCheck],
  [/monitor|availability|error|signal|analytics|behavior/i, Activity],
  [/backup|restore/i, DatabaseBackup],
  [/performance|core web vitals|rendering|pixel ratio|loading/i, Gauge],
  [/responsive|mobile|browser/i, Smartphone],
  [/api|integration|tool/i, Link2],
  [/database|content model|data model/i, Database],
  [/workflow|editorial|human review|controlled/i, Workflow],
  [/prototype|interface|design system|template/i, PanelsTopLeft],
  [/journey|information architecture|roadmap|planning|direction/i, Route],
  [/frontend|product integration/i, LayoutTemplate],
  [/backend|implementation|structured output/i, Braces],
  [/migration|release|handoff/i, GitBranch],
  [/issue|root-cause|investigation|review/i, ScanSearch],
  [/ai|provider|evaluation/i, Bot],
  [/documentation|notes|guidance/i, ClipboardCheck],
  [/model|asset|content/i, FileSearch],
];

export function getInclusionIcon(title = "") {
  return inclusionIconRules.find(([pattern]) => pattern.test(title))?.[1] || Blocks;
}

export default function PortfolioInclusionIcon({ title, ...props }) {
  const Icon = getInclusionIcon(title);
  return <Icon {...props} />;
}
