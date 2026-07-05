import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { SKILL_PILLARS } from "@/data/resume";

const RADAR_METRICS = SKILL_PILLARS.map((p) => ({
  key: p.id,
  label: p.name,
}));

const RADAR_DATA = [
  {
    label: "Capability",
    color: "#c9a84c",
    values: Object.fromEntries(SKILL_PILLARS.map((p) => [p.id, p.radar])),
  },
];

/** Lazy-loaded bklit radar of the six capability pillars. */
export default function RadarPanel() {
  return (
    <RadarChart data={RADAR_DATA} levels={4} margin={90} metrics={RADAR_METRICS}>
      <RadarGrid />
      <RadarAxis />
      <RadarLabels />
      <RadarArea index={0} />
    </RadarChart>
  );
}
