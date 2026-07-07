import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { LiveLineChart } from "@/components/charts/live-line-chart";
import { LiveLine } from "@/components/charts/live-line";
import {
  type SatPoint,
  useKuiperSatellites,
} from "@/hooks/use-kuiper-satellites";

/*
 * Lazy-loaded operations panel: WebGL globe with live-propagated Kuiper
 * satellites + a HUD telemetry overlay. Satellites render as ONE
 * THREE.Points cloud whose position buffer is rewritten in place each
 * propagation tick — the globe never rebuilds meshes, so rotation stays
 * perfectly smooth. Everything heavy (three.js, react-globe.gl,
 * satellite.js) stays inside this chunk.
 */

const MAX_SATS = 4096;

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
            className={`pointer-events-none absolute z-10 h-5 w-5 border-gold/70 border-t-2 border-l-2 ${pos}`}
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
  const satCloudRef = useRef<THREE.Points | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { status, points, count, visibleCount, nearestKm, tick } =
    useKuiperSatellites(true);
  const [samples, setSamples] = useState<TelemetrySample[]>([]);

  // One stable item + stable factory — globe.gl must build the Points object
  // exactly once. A new function identity per render would make it re-digest
  // the layer every state tick, orphaning the cloud (visible as flicker).
  const satLayerData = useMemo(() => [{ id: "kuiper-sat-cloud" }], []);
  const buildSatCloud = useCallback(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(MAX_SATS * 3), 3)
    );
    geometry.setDrawRange(0, 0);
    const material = new THREE.PointsMaterial({
      color: 0xe8d5a3,
      size: 4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloud = new THREE.Points(geometry, material);
    cloud.frustumCulled = false;
    satCloudRef.current = cloud;
    return cloud;
  }, []);

  // Track container size for the canvas.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(width * 0.92) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rewrite the point cloud's position buffer on every propagation tick.
  useEffect(() => {
    const globe = globeRef.current;
    const cloud = satCloudRef.current;
    if (!globe || !cloud || points.length === 0) return;
    const attr = cloud.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const n = Math.min(points.length, MAX_SATS);
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const { x, y, z } = globe.getCoords(p.lat, p.lng, p.alt);
      attr.setXYZ(i, x, y, z);
    }
    attr.needsUpdate = true;
    cloud.geometry.setDrawRange(0, n);
    cloud.geometry.computeBoundingSphere();
  }, [points]);

  // Feed the "in view from Kirkland" series once per propagation tick —
  // keyed on tick, not the count, which often repeats between passes.
  useEffect(() => {
    if (status !== "live" || tick === 0) return;
    setSamples((prev) =>
      [
        ...prev,
        { time: Math.floor(Date.now() / 1000), value: visibleCount },
      ].slice(-48)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, status]);

  const statusLabel =
    status === "live"
      ? `${count} satellites · live`
      : status === "offline"
        ? "telemetry offline"
        : "acquiring signal…";

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl border border-gold/25 bg-black/40"
        ref={wrapRef}
      >
        <HudCorners />

        <div className="pointer-events-none absolute top-3 left-4 z-10 flex items-center gap-2">
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
                customLayerData={satLayerData}
                customThreeObject={buildSatCloud}
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
                ref={globeRef}
                width={size.w}
              />
            )}
          </div>
        )}

        {/* HUD telemetry overlay — inside the frame, no layout gap below */}
        {status === "live" && (
          <div className="absolute inset-x-0 bottom-0 z-10 border-gold/20 border-t bg-ink/70 backdrop-blur-md">
            <div className="flex items-center gap-4 px-4 py-2.5">
              <div className="shrink-0">
                <p className="text-[0.58rem] text-muted-foreground uppercase tracking-[0.18em]">
                  In view · Kirkland WA
                </p>
                <p className="font-display text-2xl text-gold-light leading-none">
                  {visibleCount}
                </p>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                {samples.length >= 2 && (
                  <LiveLineChart
                    data={samples}
                    exaggerate
                    lerpSpeed={0.06}
                    margin={{ top: 6, right: 34, bottom: 4, left: 2 }}
                    style={{ height: 56 }}
                    value={visibleCount}
                    window={144}
                  >
                    <LiveLine
                      dataKey="value"
                      dotSize={3}
                      formatValue={(v) => `${Math.round(v)}`}
                      stroke="#c9a84c"
                    />
                  </LiveLineChart>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[0.58rem] text-muted-foreground uppercase tracking-[0.18em]">
                  Nearest sat
                </p>
                <p className="font-display text-gold-light text-lg leading-none">
                  {Math.round(nearestKm).toLocaleString()}{" "}
                  <span className="text-[0.65rem] text-muted-foreground">
                    km
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-right text-[0.62rem] text-muted-foreground/70">
        Live TLE data · Celestrak · propagated in-browser with satellite.js
      </p>
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
        Telemetry offline. Orbital display in standby.
      </p>
    </div>
  );
}

export type { SatPoint };
