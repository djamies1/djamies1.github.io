import { useCallback, useRef } from "react";
import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { RadarSweep } from "@/components/charts/radar-sweep";
import { PILLAR_MAX_YEARS, SKILL_PILLARS } from "@/data/resume";

const RADAR_METRICS = SKILL_PILLARS.map((p) => ({
  key: p.id,
  label: p.name,
}));

/* Axis unit is years of hands-on use, normalized to the longest tenure. */
const RADAR_DATA = [
  {
    label: "Years of hands-on use",
    color: "#c9a84c",
    values: Object.fromEntries(
      SKILL_PILLARS.map((p) => [p.id, (p.years / PILLAR_MAX_YEARS) * 100])
    ),
  },
];

const POINT_LABELS = Object.fromEntries(
  SKILL_PILLARS.map((p) => [p.id, `${p.years} yrs`])
);

interface RadarPanelProps {
  /** Pillar id currently hovered (radar surface or card). */
  hoverKey: string | null;
  /** Omit on touch devices to disable hover tracking. */
  onHoverKey?: (key: string | null) => void;
  /** Open the drawer for a pillar (click or tap anywhere on the chart). */
  onOpenPillar: (id: string) => void;
}

/**
 * Lazy-loaded bklit radar of the six capability pillars. The whole
 * square is one interactive surface: pointer angle picks the nearest
 * discipline, click/tap opens its drawer.
 */
export default function RadarPanel({
  hoverKey,
  onHoverKey,
  onOpenPillar,
}: RadarPanelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  /** Nearest discipline by pointer angle; null in the dead center/corners. */
  const metricFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const dx = clientX - rect.left - rect.width / 2;
    const dy = clientY - rect.top - rect.height / 2;
    const r = Math.hypot(dx, dy);
    if (r < 14 || r > Math.min(rect.width, rect.height) / 2 - 2) {
      return null;
    }
    const n = SKILL_PILLARS.length;
    const step = (Math.PI * 2) / n;
    // Chart convention: metric 0 points up, indices advance clockwise.
    const idx =
      ((Math.round((Math.atan2(dy, dx) + Math.PI / 2) / step) % n) + n) % n;
    return SKILL_PILLARS[idx]?.id ?? null;
  }, []);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: pointer affordance only; the pillar cards are the keyboard path to the same drawers
    <div
      className="cursor-pointer select-none"
      onClick={(e) => {
        const id = metricFromPoint(e.clientX, e.clientY);
        if (id) onOpenPillar(id);
      }}
      onPointerLeave={onHoverKey ? () => onHoverKey(null) : undefined}
      onPointerMove={
        onHoverKey
          ? (e) => {
              if (e.pointerType === "touch") return;
              onHoverKey(metricFromPoint(e.clientX, e.clientY));
            }
          : undefined
      }
      ref={wrapRef}
    >
      <RadarChart
        data={RADAR_DATA}
        levels={4}
        margin={90}
        metrics={RADAR_METRICS}
      >
        <RadarGrid showLabels={false} />
        <RadarAxis />
        <RadarSweep />
        <RadarLabels highlightedKey={hoverKey} interactive />
        <RadarArea
          highlightedMetricKey={hoverKey}
          index={0}
          pointLabels={POINT_LABELS}
        />
      </RadarChart>
    </div>
  );
}
