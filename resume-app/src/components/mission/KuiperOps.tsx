import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { LiveLineChart } from "@/components/charts/live-line-chart";
import { LiveLine } from "@/components/charts/live-line";
import { LiveXAxis } from "@/components/charts/live-x-axis";
import {
  type SatPoint,
  useKuiperSatellites,
} from "@/hooks/use-kuiper-satellites";

/*
 * Lazy-loaded operations panel: WebGL globe with live-propagated Kuiper
 * satellites + a streaming mean-altitude telemetry strip. Everything heavy
 * (three.js, react-globe.gl, satellite.js) stays inside this chunk.
 */

interface TelemetrySample {
  time: number;
  value: number;
  [key: string]: unknown;
}

function HudCorners() {
  return (
    <>
      {(["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"] as const).map(
        (pos) => (
          <span
            aria-hidden
            className={`pointer-events-none absolute h-5 w-5 border-gold/70 border-t-2 border-l-2 ${pos}`}
            key={pos}
          />
        )
      )}
    </>
  );
}

export default function KuiperOps() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { status, points, count, meanAltKm } = useKuiperSatellites(true);
  const [samples, setSamples] = useState<TelemetrySample[]>([]);

  // Track container size for the canvas.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(width * 0.88) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Accumulate telemetry samples as propagation ticks arrive.
  useEffect(() => {
    if (meanAltKm <= 0) return;
    setSamples((prev) =>
      [
        ...prev,
        { time: Math.floor(Date.now() / 1000), value: meanAltKm },
      ].slice(-48)
    );
  }, [meanAltKm]);

  const statusLabel =
    status === "live"
      ? `${count} satellites · live`
      : status === "offline"
        ? "telemetry offline"
        : "acquiring signal…";

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-2xl border border-gold/25 bg-black/40"
        ref={wrapRef}
      >
        <HudCorners />

        <div
          className="pointer-events-none absolute top-3 left-4 z-10 flex items-center gap-2"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "live"
                ? "animate-pulse bg-led"
                : status === "offline"
                  ? "bg-rust"
                  : "animate-pulse bg-gold"
            }`}
          />
          <span className="text-[0.65rem] text-cream/80 uppercase tracking-[0.2em]">
            Kuiper constellation · {statusLabel}
          </span>
        </div>

        {status === "offline" ? (
          <OfflineFallback height={size.h || 320} />
        ) : (
          <div style={{ height: size.h || 320 }}>
            {size.w > 0 && (
              <Globe
                atmosphereAltitude={0.18}
                atmosphereColor="#c9a84c"
                backgroundColor="rgba(0,0,0,0)"
                enablePointerInteraction={false}
                globeImageUrl={`${import.meta.env.BASE_URL}earth-dark.jpg`}
                height={size.h}
                onGlobeReady={() => {
                  const g = globeRef.current;
                  if (!g) return;
                  const controls = g.controls();
                  controls.autoRotate = true;
                  controls.autoRotateSpeed = 0.55;
                  controls.enableZoom = false;
                  controls.enablePan = false;
                  controls.enableRotate = false;
                  g.pointOfView({ altitude: 2.3 });
                }}
                pointAltitude="alt"
                pointColor={() => "rgba(232,213,163,0.85)"}
                pointLat="lat"
                pointLng="lng"
                pointRadius={0.14}
                pointsData={points as object[]}
                pointsMerge={false}
                ref={globeRef}
                width={size.w}
              />
            )}
          </div>
        )}
      </div>

      {status === "live" && samples.length >= 2 && (
        <div className="glass mt-3 rounded-xl px-4 pt-3 pb-1">
          <p className="text-[0.62rem] text-muted-foreground uppercase tracking-[0.2em]">
            Mean constellation altitude · km
          </p>
          <LiveLineChart
            className="h-24"
            data={samples}
            lerpSpeed={0.06}
            margin={{ top: 10, right: 52, bottom: 18, left: 8 }}
            value={meanAltKm}
            window={144}
          >
            <LiveLine
              dataKey="value"
              formatValue={(v) => `${Math.round(v)} km`}
              stroke="#c9a84c"
            />
            <LiveXAxis />
          </LiveLineChart>
        </div>
      )}
      {status === "live" && (
        <p className="mt-2 text-right text-[0.62rem] text-muted-foreground/70">
          Live TLE data · Celestrak · propagated in-browser with satellite.js
        </p>
      )}
    </div>
  );
}

/** Static orbital rings when live data can't be fetched — still intentional. */
function OfflineFallback({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      style={{ height }}
    >
      <svg
        aria-hidden
        className="h-3/4 w-3/4 opacity-70"
        viewBox="0 0 400 300"
      >
        <circle
          cx="200"
          cy="150"
          fill="none"
          r="80"
          stroke="#2a2a2a"
          strokeWidth="1"
        />
        {[0, 1, 2].map((i) => (
          <ellipse
            cx="200"
            cy="150"
            fill="none"
            key={i}
            rx={120 + i * 28}
            ry={44 + i * 14}
            stroke="#c9a84c"
            strokeOpacity={0.4 - i * 0.1}
            strokeWidth="1"
            transform={`rotate(${-18 + i * 14} 200 150)`}
          />
        ))}
        <circle cx="200" cy="150" fill="#1c1c1c" r="60" />
        <circle
          cx="200"
          cy="150"
          fill="none"
          r="60"
          stroke="#c9a84c"
          strokeOpacity="0.5"
        />
      </svg>
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
        Telemetry offline — orbital display in standby
      </p>
    </div>
  );
}

export type { SatPoint };
