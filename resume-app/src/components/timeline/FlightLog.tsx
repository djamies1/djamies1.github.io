import { ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { useMemo, useRef, useState } from "react";
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

const COMPANY_SHORT: Record<string, string> = {
  "amazon-leo": "Amazon Leo",
  "amazon-pxt": "Amazon PXT",
  "pac-bi": "PAC Worldwide",
  "pac-fpa": "PAC Worldwide",
  falck: "Falck USA",
  ey: "Ernst & Young",
  "inspired-led": "Inspired LED",
};

/* Scroll budget per role while the stage is pinned. */
const SEGMENT_VH = 80;

const startYear = (job: Job) =>
  new Date(`${job.start}T00:00:00`).getFullYear();

/* Direction-aware crossfade: scrolling down slides up, and vice versa. */
const cardVariants = {
  enter: (dir: number) => ({ opacity: 0, y: 40 * dir, scale: 0.985 }),
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, y: -34 * dir, scale: 0.99 }),
};

/**
 * Pinned scrollytelling timeline: the stage sticks while the section
 * scrolls, and each scroll segment crossfades to the next role (newest
 * first). The rail doubles as click-to-jump navigation.
 */
export function FlightLog() {
  const containerRef = useRef<HTMLElement>(null);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const dirRef = useRef(1);
  const series = useMemo(() => buildScopeSeries(), []);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const fill = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.5,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.max(
      0,
      Math.min(JOBS.length - 1, Math.floor(v * JOBS.length))
    );
    if (next !== idxRef.current) {
      dirRef.current = next > idxRef.current ? 1 : -1;
      idxRef.current = next;
      setIdx(next);
    }
  });

  const job = JOBS[idx];
  const accent = ACCENT_HEX[job.accent] ?? "#c9a84c";

  /** Scroll the page so segment i sits at its centre (rail click-jump). */
  const jumpTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    const usable = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((i + 0.5) / JOBS.length) * usable,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      className="relative"
      id="flight-log"
      ref={containerRef}
      style={{ height: `${JOBS.length * SEGMENT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeading
            className="mb-5 md:mb-10"
            eyebrow="02 · Experience"
            lede="Newest first. Keep scrolling to move through the roles, or jump from the rail."
            title="Career timeline"
          />

          {/* horizontal rail (small screens) */}
          <div className="relative mb-5 lg:hidden">
            <div
              aria-hidden
              className="absolute top-[5px] right-2 left-2 h-px bg-white/10"
            />
            <motion.div
              aria-hidden
              className="absolute top-[5px] right-2 left-2 h-px origin-left bg-gold"
              style={{
                scaleX: fill,
                boxShadow: "0 0 8px rgba(201,168,76,0.4)",
              }}
            />
            <ol className="flex justify-between">
              {JOBS.map((j, i) => {
                const a = ACCENT_HEX[j.accent] ?? "#c9a84c";
                const active = i === idx;
                return (
                  <li key={j.id}>
                    <button
                      aria-current={active ? "step" : undefined}
                      aria-label={`${j.role}, ${j.company}, ${startYear(j)}`}
                      className="-mt-1 flex min-w-[36px] flex-col items-center gap-1.5 pt-1 pb-1"
                      onClick={() => jumpTo(i)}
                      type="button"
                    >
                      <span
                        className="h-[11px] w-[11px] rounded-full border transition-all duration-300"
                        style={{
                          background: active ? a : "#141414",
                          borderColor: active
                            ? a
                            : "rgba(255,255,255,0.3)",
                          boxShadow: active ? `0 0 10px ${a}66` : "none",
                        }}
                      />
                      <span
                        className={cn(
                          "font-mono text-[0.6rem] transition-colors duration-300",
                          active
                            ? "text-gold-light"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {startYear(j)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
            {/* vertical rail (desktop) */}
            <div className="relative hidden lg:block">
              <div
                aria-hidden
                className="absolute inset-y-2 left-[5px] w-px bg-white/10"
              />
              <motion.div
                aria-hidden
                className="absolute inset-y-2 left-[5px] w-px origin-top bg-gold"
                style={{
                  scaleY: fill,
                  boxShadow: "0 0 8px rgba(201,168,76,0.4)",
                }}
              />
              <ol className="flex h-[340px] flex-col justify-between">
                {JOBS.map((j, i) => {
                  const a = ACCENT_HEX[j.accent] ?? "#c9a84c";
                  const active = i === idx;
                  return (
                    <li key={j.id}>
                      <button
                        aria-current={active ? "step" : undefined}
                        className="group flex items-center gap-3 text-left"
                        onClick={() => jumpTo(i)}
                        type="button"
                      >
                        <span
                          className="h-[11px] w-[11px] shrink-0 rounded-full border transition-all duration-300"
                          style={{
                            background: active ? a : "#141414",
                            borderColor: active
                              ? a
                              : "rgba(255,255,255,0.3)",
                            boxShadow: active
                              ? `0 0 10px ${a}66`
                              : "none",
                          }}
                        />
                        <span
                          className={cn(
                            "font-mono text-xs transition-colors duration-300",
                            active
                              ? "text-gold-light"
                              : "text-muted-foreground/70 group-hover:text-cream/80"
                          )}
                        >
                          {startYear(j)} · {COMPANY_SHORT[j.id] ?? j.company}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* card stage */}
            <div className="relative">
              {/* ghost year, swaps with the role */}
              <motion.p
                animate={{ opacity: 1 }}
                aria-hidden
                className="-top-12 md:-top-20 pointer-events-none absolute right-0 select-none font-display text-[5.5rem] text-cream/[0.05] leading-none md:text-[9rem]"
                initial={{ opacity: 0 }}
                key={`ghost-${startYear(job)}`}
                transition={{ duration: reducedMotion ? 0 : 0.5 }}
              >
                {startYear(job)}
              </motion.p>

              <div className="grid min-h-[360px]">
                <AnimatePresence custom={dirRef.current} initial={false}>
                  <motion.article
                    animate="center"
                    className="glass relative self-center overflow-hidden rounded-2xl p-5 [grid-area:1/1] sm:p-6 md:p-8"
                    custom={dirRef.current}
                    exit="exit"
                    initial="enter"
                    key={job.id}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                    }
                    variants={cardVariants}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{
                        background: `linear-gradient(180deg, ${accent}, transparent)`,
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
                        <h3 className="mt-2 font-display text-cream text-xl sm:text-2xl md:text-3xl">
                          {job.role}
                        </h3>
                        <p className="mt-1 font-medium text-sm sm:text-base">
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

                    <p className="mt-3 max-w-3xl text-cream/80 text-sm leading-relaxed sm:mt-4 sm:text-base">
                      {job.tagline}
                    </p>

                    {job.metrics.length > 0 && (
                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:mt-5 sm:flex sm:flex-wrap sm:gap-x-10">
                        {job.metrics.slice(0, 4).map((m) => (
                          <div key={m.label}>
                            <dd className="font-display text-gold-light text-xl sm:text-2xl">
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
            </div>
          </div>
        </div>
      </div>

      <RoleDrawer job={drawerJob} onClose={() => setDrawerJob(null)} />
    </section>
  );
}
