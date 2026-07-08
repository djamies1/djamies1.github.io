"use client";

import { useReducedMotion } from "motion/react";
import { useRadarStable } from "./radar-context";

export interface RadarSweepProps {
  /** Sweep color. Default: gold. */
  color?: string;
  /** Seconds per full rotation. Default: 8. */
  durationSec?: number;
  /** Additional class name */
  className?: string;
}

const TRAIL_WEDGES = 6;
const WEDGE_DEG = 7;

/**
 * Slow rotating radar sweep: a leading hairline with a fading wedge
 * trail, clipped to the chart radius. Purely decorative (no pointer
 * events); hidden under reduced motion.
 */
export function RadarSweep({
  color = "#c9a84c",
  durationSec = 8,
  className = "",
}: RadarSweepProps) {
  const { radius } = useRadarStable();
  const reducedMotion = useReducedMotion();

  if (reducedMotion || radius <= 0) {
    return null;
  }

  const rad = (deg: number) => (deg * Math.PI) / 180;
  const wedges = Array.from({ length: TRAIL_WEDGES }, (_, i) => {
    // Trail sits behind the leading edge (at 0°) against the clockwise spin.
    const a1 = rad(-(i + 1) * WEDGE_DEG);
    const a2 = rad(-i * WEDGE_DEG);
    const d = [
      "M 0 0",
      `L ${radius * Math.cos(a1)} ${radius * Math.sin(a1)}`,
      `A ${radius} ${radius} 0 0 1 ${radius * Math.cos(a2)} ${
        radius * Math.sin(a2)
      }`,
      "Z",
    ].join(" ");
    return { d, opacity: 0.09 * (1 - i / TRAIL_WEDGES) };
  });

  return (
    <g className={className} style={{ pointerEvents: "none" }}>
      <g>
        {wedges.map((w) => (
          <path d={w.d} fill={color} key={w.d} opacity={w.opacity} />
        ))}
        <line
          stroke={color}
          strokeOpacity={0.3}
          strokeWidth={1}
          x1={0}
          x2={radius}
          y1={0}
          y2={0}
        />
        <animateTransform
          attributeName="transform"
          dur={`${durationSec}s`}
          from="0 0 0"
          repeatCount="indefinite"
          to="360 0 0"
          type="rotate"
        />
      </g>
    </g>
  );
}

RadarSweep.displayName = "RadarSweep";

export default RadarSweep;
