import { createDraggable, type Draggable } from "animejs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { RoleDrawer } from "@/components/timeline/RoleDrawer";
import { TenureSparkline } from "@/components/timeline/TenureSparkline";
import {
  buildBands,
  buildScopeSeries,
  dateAtFrac,
  fracOf,
  jobAtDate,
  jobMidFrac,
  seriesForJob,
  TIMELINE_JOBS,
} from "@/components/timeline/career-data";
import { formatRange } from "@/data/resume";
import type { Job } from "@/data/types";
import { cn } from "@/lib/utils";

const CareerChart = lazy(() => import("@/components/timeline/CareerChart"));

/*
 * Rail geometry: the chart plot, tenure bands, and scrubber all use the same
 * horizontal inset so one 0–1 fraction lines up across all three layers.
 */
const EDGE = 22; // px inset each side
const NEEDLE_W = 44; // px hit target; visual line centred inside

const ACCENT_HEX: Record<string, string> = {
  amazon: "#ff9900",
  pac: "#5c8fe6",
  falck: "#e0604a",
  led: "#3ecf7a",
  ey: "#9a9ab0",
};

const COMPANY_SHORT: Record<string, string> = {
  "amazon-leo": "Amazon Leo",
  "amazon-pxt": "Amazon PXT",
  "pac-bi": "PAC",
  "pac-fpa": "PAC",
  falck: "Falck",
  "inspired-led": "Inspired LED",
  ey: "EY",
};

export function FlightLog() {
  const jobs = TIMELINE_JOBS;
  const series = useMemo(() => buildScopeSeries(), []);
  const bands = useMemo(() => buildBands(), []);
  const midFracs = useMemo(() => jobs.map(jobMidFrac), [jobs]);

  const [activeIdx, setActiveIdx] = useState(jobs.length - 1);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [hover, setHover] = useState<{ x: number; date: Date } | null>(null);
  const reducedMotion = useReducedMotion();

  const railRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const snapsRef = useRef<number[]>([]);
  const draggingRef = useRef(false);
  const activeRef = useRef(activeIdx);
  activeRef.current = activeIdx;

  const activeJob = jobs[activeIdx];
  const sparkPoints = useMemo(
    () => seriesForJob(series, activeJob),
    [series, activeJob]
  );
  const hoverJob = hover ? jobAtDate(hover.date) : undefined;

  /** Move the needle to a role (programmatic: keys, chips, band clicks). */
  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(TIMELINE_JOBS.length - 1, idx));
    setActiveIdx(clamped);
    const d = draggableRef.current;
    const x = snapsRef.current[clamped];
    if (d && x !== undefined) {
      d.setX(x, true);
    }
  }, []);

  // Build (and rebuild on resize) the anime.js draggable scrubber.
  useEffect(() => {
    const rail = railRef.current;
    const needle = needleRef.current;
    if (!rail || !needle) return;

    const setup = () => {
      draggableRef.current?.revert();
      const usable = rail.clientWidth - NEEDLE_W;
      const snaps = midFracs.map((f) => Math.round(f * usable));
      snapsRef.current = snaps;

      const nearest = (x: number) => {
        let best = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const [i, s] of snaps.entries()) {
          const dist = Math.abs(x - s);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
        return best;
      };

      draggableRef.current = createDraggable(needle, {
        container: rail,
        y: false,
        x: { snap: snaps },
        containerFriction: 1,
        releaseEase: "outExpo",
        onGrab: () => {
          draggingRef.current = true;
          setHover(null);
        },
        onRelease: () => {
          draggingRef.current = false;
        },
        onUpdate: (self) => {
          const idx = nearest(self.x);
          if (idx !== activeRef.current) setActiveIdx(idx);
        },
      });
      draggableRef.current.setX(snaps[activeRef.current] ?? 0, true);
    };

    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(rail);
    return () => {
      ro.disconnect();
      draggableRef.current?.revert();
      draggableRef.current = null;
    };
  }, [midFracs]);

  const onRailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      goTo(activeRef.current + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      goTo(activeRef.current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(jobs.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDrawerJob(jobs[activeRef.current]);
    }
  };

  const activeYear = new Date(`${activeJob.start}T00:00:00`).getFullYear();

  return (
    <section className="mx-auto max-w-6xl px-6 py-24" id="flight-log">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          className="mb-0 md:mb-0"
          eyebrow="02 · Experience"
          lede="Thirteen years from audit rooms to satellite finance. Drag the needle, or use the arrow keys, to step through each role."
          title="Career trajectory"
        />
        <div className="flex items-center gap-3 pb-1">
          <span className="font-display text-2xl text-gold-light tabular-nums">
            {String(activeIdx + 1).padStart(2, "0")}
            <span className="text-muted-foreground/60 text-lg">
              {" "}
              / {String(jobs.length).padStart(2, "0")}
            </span>
          </span>
          <button
            aria-label="Previous role"
            className="glass rounded-full p-2.5 text-cream transition-colors hover:text-gold disabled:opacity-30"
            disabled={activeIdx === 0}
            onClick={() => goTo(activeIdx - 1)}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next role"
            className="glass rounded-full p-2.5 text-cream transition-colors hover:text-gold disabled:opacity-30"
            disabled={activeIdx === jobs.length - 1}
            onClick={() => goTo(activeIdx + 1)}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Chart + scrubber (desktop) ── */}
      <div className="glass relative mt-8 hidden rounded-2xl pt-5 pb-1 md:block">
        <div className="pointer-events-none absolute top-5 left-6 z-10">
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
            Role scope · stylised index
          </p>
        </div>
        <p className="pointer-events-none absolute top-4 right-6 z-10 font-display text-5xl text-cream/[0.06] leading-none">
          {activeYear}
        </p>

        {/* tenure bands — same EDGE inset as the chart margins */}
        <div
          aria-hidden
          className="absolute inset-y-6 z-0"
          style={{ left: EDGE, right: EDGE }}
        >
          {bands.map(({ job, left, width }) => (
            <div
              className={cn(
                "absolute inset-y-0 border-b-2 transition-opacity duration-500",
                jobs[activeIdx].id === job.id ||
                  (job.company === jobs[activeIdx].company &&
                    jobs[activeIdx].id !== "ey")
                  ? "opacity-100"
                  : "opacity-35"
              )}
              key={job.id}
              style={{
                left: `${left * 100}%`,
                width: `${width * 100}%`,
                background: `linear-gradient(180deg, transparent 45%, ${ACCENT_HEX[job.accent]}26)`,
                borderColor: `${ACCENT_HEX[job.accent]}88`,
              }}
            />
          ))}
          {/* EY internship marker */}
          <button
            aria-label="Ernst & Young internship, summer 2014"
            className="-translate-x-1/2 absolute bottom-1 z-10 h-3 w-3 rotate-45 border border-ey bg-ink transition-colors hover:bg-ey"
            onClick={() => goTo(jobs.findIndex((j) => j.id === "ey"))}
            style={{
              left: `${fracOf(new Date("2014-07-01T00:00:00")) * 100}%`,
            }}
            type="button"
          />
        </div>

        <Suspense
          fallback={<div className="aspect-[4.4/1] w-full" />}
        >
          <CareerChart
            edge={EDGE}
            reducedMotion={reducedMotion ?? false}
            series={series}
          />
        </Suspense>

        {/* scrubber rail overlaying the plot */}
        <div
          aria-label="Career timeline scrubber"
          aria-valuemax={jobs.length - 1}
          aria-valuemin={0}
          aria-valuenow={activeIdx}
          aria-valuetext={`${activeJob.role}, ${activeJob.company}, ${formatRange(activeJob)}`}
          className="absolute inset-y-0 right-0 left-0 z-10 focus-visible:outline-none"
          onKeyDown={onRailKeyDown}
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            // Hover ghost: which role was held at the hovered moment.
            if (draggingRef.current || e.pointerType === "touch") return;
            const rail = railRef.current;
            if (!rail) return;
            const rect = rail.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const frac = Math.min(
              1,
              Math.max(0, (x - EDGE) / (rect.width - EDGE * 2))
            );
            setHover({ x, date: dateAtFrac(frac) });
          }}
          onPointerDown={(e) => {
            // Click anywhere on the rail jumps to the nearest role; the
            // needle itself is handled by the anime.js draggable.
            if (needleRef.current?.contains(e.target as Node)) return;
            const rail = railRef.current;
            if (!rail) return;
            const px =
              e.clientX - rail.getBoundingClientRect().left - NEEDLE_W / 2;
            const snaps = snapsRef.current;
            let best = 0;
            let bestDist = Number.POSITIVE_INFINITY;
            for (const [i, s] of snaps.entries()) {
              const dist = Math.abs(px - s);
              if (dist < bestDist) {
                bestDist = dist;
                best = i;
              }
            }
            goTo(best);
          }}
          ref={railRef}
          role="slider"
          tabIndex={0}
        >
          {/* hover ghost — hairline + role-at-this-moment label */}
          {hover && hoverJob && (
            <div aria-hidden className="pointer-events-none">
              <div
                className="absolute inset-y-8 w-px bg-cream/25"
                style={{ left: hover.x }}
              />
              <div
                className="-translate-x-1/2 absolute top-10 flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-ink-2/95 px-3 py-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                style={{
                  left: Math.min(
                    Math.max(hover.x, 130),
                    (railRef.current?.clientWidth ?? 800) - 130
                  ),
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: ACCENT_HEX[hoverJob.accent] }}
                />
                <span className="font-mono text-[0.62rem] text-muted-foreground">
                  {hover.date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-cream text-xs">
                  {hoverJob.role}
                  <span className="text-muted-foreground">
                    {" "}
                    · {hoverJob.company}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div
            className="group absolute inset-y-0 cursor-grab active:cursor-grabbing"
            ref={needleRef}
            style={{ width: NEEDLE_W }}
          >
            <div className="-translate-x-1/2 absolute inset-y-3 left-1/2 w-px bg-gradient-to-b from-gold via-gold/70 to-transparent" />
            <div
              className="-translate-x-1/2 absolute top-1 left-1/2 flex h-7 min-w-7 items-center justify-center rounded-full border border-gold bg-ink px-1.5 shadow-[0_0_18px_rgba(201,168,76,0.35)] transition-transform duration-200 group-hover:scale-110"
              style={{ borderColor: ACCENT_HEX[activeJob.accent] }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ACCENT_HEX[activeJob.accent] }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile role chips ── */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 md:hidden">
        {jobs.map((job, i) => (
          <button
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              i === activeIdx
                ? "border-gold bg-gold/15 text-gold-light"
                : "border-white/12 text-muted-foreground"
            )}
            key={job.id}
            onClick={() => setActiveIdx(i)}
            type="button"
          >
            {new Date(`${job.start}T00:00:00`).getFullYear()} ·{" "}
            {COMPANY_SHORT[job.id] ?? job.company}
          </button>
        ))}
      </div>

      {/* ── Active role card ── */}
      <div className="relative mt-5 min-h-[230px] md:mt-6">
        <AnimatePresence mode="wait">
          <motion.article
            animate={{ opacity: 1, y: 0 }}
            className="glass relative overflow-hidden rounded-2xl p-6 md:p-8"
            exit={{ opacity: 0, y: -14 }}
            initial={{ opacity: 0, y: 18 }}
            key={activeJob.id}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{
                background: `linear-gradient(180deg, ${ACCENT_HEX[activeJob.accent]}, transparent)`,
              }}
            />
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                {activeJob.highlight ? (
                  <p className="mb-2 inline-block rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.7rem] text-gold-light tracking-wide">
                    {activeJob.highlight}
                  </p>
                ) : null}
                <h3 className="font-display text-2xl text-cream md:text-3xl">
                  {activeJob.role}
                </h3>
                <p className="mt-1 font-medium text-base">
                  <span style={{ color: ACCENT_HEX[activeJob.accent] }}>
                    {activeJob.company}
                  </span>
                  {activeJob.org ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {activeJob.org}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {formatRange(activeJob)} · {activeJob.location}
                  {activeJob.end === null ? (
                    <span className="ml-2 inline-flex items-center gap-1.5 text-gold-light">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                      Current
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <button
                  className="group inline-flex items-center gap-2 rounded-lg border border-gold/40 px-5 py-2.5 font-medium text-gold-light text-sm transition-all duration-300 hover:border-gold hover:bg-gold/10"
                  onClick={() => setDrawerJob(activeJob)}
                  type="button"
                >
                  Role details
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                <TenureSparkline
                  accent={ACCENT_HEX[activeJob.accent] ?? "#c9a84c"}
                  jobId={activeJob.id}
                  points={sparkPoints}
                />
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-cream/80 leading-relaxed">
              {activeJob.tagline}
            </p>

            {activeJob.metrics.length > 0 && (
              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                {activeJob.metrics.slice(0, 4).map((m) => (
                  <div key={m.label}>
                    <dd className="font-display text-2xl text-gold-light">
                      {m.display ?? m.value}
                    </dd>
                    <dt className="mt-0.5 text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]">
                      {m.label}
                    </dt>
                  </div>
                ))}
              </dl>
            )}
          </motion.article>
        </AnimatePresence>
      </div>

      <RoleDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />
    </section>
  );
}
