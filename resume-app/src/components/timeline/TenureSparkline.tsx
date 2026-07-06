import { motion } from "motion/react";
import { useMemo } from "react";
import type { ScopePoint } from "@/components/timeline/career-data";

const W = 140;
const H = 34;
const PAD = 3;

interface TenureSparklineProps {
  /** Scope points restricted to the role's tenure. */
  points: ScopePoint[];
  /** Company accent hex. */
  accent: string;
  /** Remounts (and re-draws) when the active role changes. */
  jobId: string;
}

/** Tiny area trace of a role's scope ramp — one glance says "grew here". */
export function TenureSparkline({
  points,
  accent,
  jobId,
}: TenureSparklineProps) {
  const paths = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((p) => p.scope);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coords = values.map((v, i) => ({
      x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
      y: H - PAD - ((v - min) / span) * (H - PAD * 2),
    }));
    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L ${coords.at(-1)?.x.toFixed(1)} ${H - PAD} L ${PAD} ${H - PAD} Z`;
    return { line, area };
  }, [points]);

  if (!paths) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <svg
        aria-hidden
        height={H}
        key={jobId}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
      >
        <motion.path
          animate={{ opacity: 1 }}
          d={paths.area}
          fill={accent}
          fillOpacity={0.14}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        />
        <motion.path
          animate={{ pathLength: 1 }}
          d={paths.line}
          fill="none"
          initial={{ pathLength: 0 }}
          stroke={accent}
          strokeLinecap="round"
          strokeWidth={1.6}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        />
        <motion.circle
          animate={{ opacity: 1, scale: 1 }}
          cx={W - PAD}
          cy={PAD}
          fill={accent}
          initial={{ opacity: 0, scale: 0 }}
          r={2.4}
          transition={{ duration: 0.3, delay: 0.9 }}
        />
      </svg>
      <p className="text-[0.58rem] text-muted-foreground/70 uppercase tracking-[0.16em]">
        Scope during tenure
      </p>
    </div>
  );
}
