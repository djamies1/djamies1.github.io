import { ChevronRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { RoleDrawer } from "@/components/timeline/RoleDrawer";
import { TenureSparkline } from "@/components/timeline/TenureSparkline";
import {
  buildScopeSeries,
  seriesForJob,
} from "@/components/timeline/career-data";
import { formatRange, JOBS } from "@/data/resume";
import type { Job } from "@/data/types";
import { cn } from "@/lib/utils";

const ACCENT_HEX: Record<string, string> = {
  amazon: "#ff9900",
  pac: "#5c8fe6",
  falck: "#e0604a",
  led: "#3ecf7a",
  ey: "#9a9ab0",
};

/* Rail geometry: node centres sit on the rail line. */
const RAIL_X = 7; // px from the <ol> left edge
const NODE = 15; // px hit box; the dot is centred inside

/**
 * Scroll-driven career timeline, newest role first. A gold line fills
 * the rail in step with scroll, the role nearest the viewport centre
 * carries the accent, and each card opens the full role drawer.
 */
export function FlightLog() {
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [activeId, setActiveId] = useState<string>(JOBS[0]?.id ?? "");
  const series = useMemo(() => buildScopeSeries(), []);
  const listRef = useRef<HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();

  // The rail fill tracks scroll: starts once the list enters the lower
  // viewport, completes just past centre of the last entry.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.78", "end 0.55"],
  });
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    mass: 0.6,
  });

  // The role crossing a band around the viewport centre is "active".
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.jobId;
            if (id) setActiveId(id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    for (const el of root.querySelectorAll<HTMLElement>("[data-job-id]")) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-24" id="flight-log">
      <SectionHeading
        eyebrow="02 · Experience"
        lede="Every role since 2013, newest first. The gold line keeps pace as you scroll."
        title="Career timeline"
      />

      <ol className="relative ml-1 sm:ml-2" ref={listRef}>
        {/* rail + scroll-driven gold fill */}
        <div
          aria-hidden
          className="absolute inset-y-2 w-px bg-white/10"
          style={{ left: RAIL_X }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-2 w-px origin-top bg-gradient-to-b from-gold via-gold/80 to-gold/40"
          style={{
            left: RAIL_X,
            scaleY: reducedMotion ? 1 : lineScale,
            boxShadow: "0 0 8px rgba(201,168,76,0.45)",
          }}
        />

        {JOBS.map((job) => {
          const isActive = activeId === job.id;
          const accent = ACCENT_HEX[job.accent] ?? "#c9a84c";
          return (
            <li
              className="relative pb-5 last:pb-0"
              data-job-id={job.id}
              key={job.id}
            >
              {/* rail node */}
              <span
                aria-hidden
                className="absolute top-8 flex items-center justify-center"
                style={{
                  left: RAIL_X - NODE / 2 + 0.5,
                  height: NODE,
                  width: NODE,
                }}
              >
                {isActive ? (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
                    style={{ background: accent }}
                  />
                ) : null}
                <span
                  className="relative inline-flex h-[9px] w-[9px] rounded-full border transition-all duration-300"
                  style={{
                    background: isActive ? accent : "#141414",
                    borderColor: isActive ? accent : "rgba(255,255,255,0.3)",
                    boxShadow: isActive ? `0 0 12px ${accent}66` : "none",
                  }}
                />
              </span>

              <motion.article
                className={cn(
                  "glass relative ml-8 overflow-hidden rounded-2xl border p-6 transition-all duration-500 sm:ml-12 md:p-7",
                  isActive
                    ? "border-gold/40 shadow-[0_0_32px_rgba(201,168,76,0.08)]"
                    : "border-white/10"
                )}
                initial={reducedMotion ? false : { opacity: 0, y: 26 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, margin: "-60px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* company accent stripe */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[3px] transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(180deg, ${accent}, transparent)`,
                    opacity: isActive ? 1 : 0.4,
                  }}
                />

                <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                  <div className="min-w-0">
                    <p className="font-mono text-muted-foreground text-xs tracking-wide">
                      {formatRange(job)} · {job.location}
                      {job.end === null ? (
                        <span className="ml-2 inline-flex items-center gap-1.5 text-gold-light">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                          Current
                        </span>
                      ) : null}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-cream md:text-3xl">
                      {job.role}
                    </h3>
                    <p className="mt-1 font-medium text-base">
                      <span style={{ color: accent }}>{job.company}</span>
                      {job.org ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {job.org}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <button
                      className="group inline-flex items-center gap-2 rounded-lg border border-gold/40 px-5 py-2.5 font-medium text-gold-light text-sm transition-all duration-300 hover:border-gold hover:bg-gold/10"
                      onClick={() => setDrawerJob(job)}
                      type="button"
                    >
                      Role details
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </button>
                    <div className="hidden sm:block">
                      <TenureSparkline
                        accent={accent}
                        jobId={job.id}
                        points={seriesForJob(series, job)}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-cream/80 leading-relaxed">
                  {job.tagline}
                </p>

                {job.metrics.length > 0 && (
                  <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
                    {job.metrics.slice(0, 4).map((m) => (
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
            </li>
          );
        })}
      </ol>

      <RoleDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />
    </section>
  );
}
