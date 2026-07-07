import {
  BarChart3,
  Cloud,
  Database,
  Landmark,
  type LucideIcon,
  Sparkles,
  Workflow,
} from "lucide-react";

/** Lucide icon per capability pillar id (data stays icon-free). */
const PILLAR_ICONS: Record<string, LucideIcon> = {
  "data-engineering": Database,
  "bi-visualisation": BarChart3,
  "python-ml-genai": Sparkles,
  "cloud-aws": Cloud,
  "financial-analytics": Landmark,
  "systems-erp": Workflow,
};

export function PillarIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = PILLAR_ICONS[id];
  return Icon ? <Icon aria-hidden className={className} /> : null;
}
