import {
  AudioLines,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  GitCompare,
  type LucideIcon,
  MonitorSmartphone,
  Orbit,
  RadioTower,
  Rocket,
  Satellite,
  Waypoints,
} from "lucide-react";

/** Lucide icon per blueprint project id (data stays icon-free). */
const BLUEPRINT_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  satellite: Satellite,
  gateway: RadioTower,
  terminal: MonitorSmartphone,
  spectrum: AudioLines,
  constellation: Orbit,
  datapath: Waypoints,
  deployment: CalendarClock,
  latency: Gauge,
  comparison: GitCompare,
  economics: CircleDollarSign,
};

export function BlueprintIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = BLUEPRINT_ICONS[id];
  return Icon ? <Icon aria-hidden className={className} /> : null;
}
