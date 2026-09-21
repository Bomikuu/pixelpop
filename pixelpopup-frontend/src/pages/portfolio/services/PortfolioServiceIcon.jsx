import {
  Bot,
  Box,
  Code2,
  Gauge,
  PanelsTopLeft,
  Palette,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const icons = {
  bot: Bot,
  box: Box,
  code: Code2,
  gauge: Gauge,
  panels: PanelsTopLeft,
  palette: Palette,
  shield: ShieldCheck,
  wrench: Wrench,
};

export default function PortfolioServiceIcon({ name, ...props }) {
  const Icon = icons[name] || Code2;
  return <Icon {...props} />;
}
