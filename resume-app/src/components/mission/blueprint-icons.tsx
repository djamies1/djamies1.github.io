import {
  AudioLines,
  type LucideIcon,
  MonitorSmartphone,
  RadioTower,
  Rocket,
  Satellite,
} from "lucide-react";

/** Lucide icon per blueprint project id (data stays icon-free). */
const BLUEPRINT_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  satellite: Satellite,
  gateway: RadioTower,
  terminal: MonitorSmartphone,
  spectrum: AudioLines,
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
