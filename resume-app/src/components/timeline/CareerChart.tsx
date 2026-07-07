import { Area, AreaChart } from "@/components/charts/area-chart";
import XAxis from "@/components/charts/x-axis";
import type { ScopePoint } from "@/components/timeline/career-data";

interface CareerChartProps {
  series: ScopePoint[];
  reducedMotion: boolean;
  /** Horizontal inset matching the band/scrubber layers. */
  edge: number;
}

/** Lazy-loaded visx area chart backbone of the Flight Log. */
export default function CareerChart({
  series,
  reducedMotion,
  edge,
}: CareerChartProps) {
  return (
    <AreaChart
      animationDuration={reducedMotion ? 0 : 1400}
      aspectRatio="4.4 / 1"
      className="relative z-[1]"
      data={series}
      margin={{ top: 22, right: edge, bottom: 28, left: edge }}
      xDataKey="date"
    >
      <Area
        dataKey="scope"
        fill="#c9a84c"
        fillOpacity={0.32}
        gradientToOpacity={0}
        stroke="#c9a84c"
        strokeWidth={2}
      />
      <XAxis numTicks={7} tickMode="domain" />
    </AreaChart>
  );
}
