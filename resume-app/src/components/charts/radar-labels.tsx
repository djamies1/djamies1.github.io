"use client";

import { motion } from "motion/react";
import { radarCssVars, useRadarStable } from "./radar-context";

export interface RadarLabelsProps {
  /** Distance from the chart edge. Default: 24 */
  offset?: number;
  /** Font size for labels. Default: 11 */
  fontSize?: number;
  /** Enable interactive hover on labels. Default: false */
  interactive?: boolean;
  /** Metric key to render emphasized (gold, bold); others dim. */
  highlightedKey?: string | null;
  /** Reports which metric the pointer is over (null on leave). */
  onMetricHover?: (key: string | null) => void;
  /** Additional class name */
  className?: string;
}

/* Invisible hit target behind each label so hovering is forgiving. */
const HIT_W = 110;
const HIT_H = 30;

export function RadarLabels({
  offset = 24,
  fontSize = 11,
  interactive = false,
  highlightedKey = null,
  onMetricHover,
  className = "",
}: RadarLabelsProps) {
  const { metrics, radius, levels, getAngle, animate } = useRadarStable();

  // Label animation delay (starts after grid begins)
  const gridStagger = 0.08;
  const labelDelay = levels * gridStagger * 0.5;

  const labelRadius = radius + offset;
  const anyHighlight = highlightedKey !== null;

  return (
    <g className={className}>
      {metrics.map((metric, i) => {
        const angle = getAngle(i);
        const x = labelRadius * Math.cos(angle);
        const y = labelRadius * Math.sin(angle);
        const isHighlighted = highlightedKey === metric.key;

        return (
          <motion.g
            animate={{ opacity: 1, x, y }}
            initial={
              animate ? { opacity: 0, x: 0, y: 0 } : { opacity: 1, x, y }
            }
            key={`label-${metric.key}`}
            onMouseEnter={
              onMetricHover ? () => onMetricHover(metric.key) : undefined
            }
            onMouseLeave={onMetricHover ? () => onMetricHover(null) : undefined}
            transition={{
              opacity: {
                duration: 0.5,
                delay: animate ? labelDelay + i * 0.08 : 0,
              },
              x: { type: "spring", stiffness: 80, damping: 15 },
              y: { type: "spring", stiffness: 80, damping: 15 },
            }}
          >
            {onMetricHover ? (
              <rect
                fill="transparent"
                height={HIT_H}
                style={{ cursor: "pointer" }}
                width={HIT_W}
                x={-HIT_W / 2}
                y={-HIT_H / 2}
              />
            ) : null}
            <text
              className={
                interactive || onMetricHover
                  ? "cursor-pointer transition-all duration-200"
                  : ""
              }
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight={isHighlighted ? 700 : 500}
              opacity={
                isHighlighted ? 1 : anyHighlight ? 0.45 : interactive ? 0.8 : 1
              }
              style={{
                fill: isHighlighted ? "#e8d5a3" : radarCssVars.label,
                pointerEvents: "none",
              }}
              textAnchor="middle"
              x={0}
              y={0}
            >
              {metric.label}
            </text>
          </motion.g>
        );
      })}
    </g>
  );
}

RadarLabels.displayName = "RadarLabels";

export default RadarLabels;
