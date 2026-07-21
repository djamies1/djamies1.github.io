import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { BLUEPRINTS } from "@/data/blueprints";
import type { BlueprintProject } from "@/data/types";
import { cn } from "@/lib/utils";
import { BlueprintIcon } from "./blueprint-icons";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const captionSwap = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/**
 * Tabbed showcase for the five standalone "blueprint" scrollytelling projects
 * (cyanotype SVG + GSAP, sibling folders at the repo root, not part of this
 * app). Each tab embeds that project's own player-mode iframe untouched
 * (autoplay, loop, no scroll) — the frame around it is this site's chrome,
 * the sheet inside stays native. Only the active tab's iframe is ever
 * mounted, and switching tabs remounts it from scratch (key={project.id}).
 */
export function BlueprintShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, "400px");
  const [activeId, setActiveId] = useState(BLUEPRINTS[0].id);
  const active =
    BLUEPRINTS.find((b) => b.id === activeId) ?? (BLUEPRINTS[0] as BlueprintProject);
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  return (
    <motion.div
      className="mt-16"
      initial="hidden"
      ref={rootRef}
      variants={reveal}
      viewport={{ once: true, margin: "-80px" }}
      whileInView="show"
    >
      <p className="eyebrow mb-5">The blueprints</p>
      <p className="max-w-2xl text-cream/85 text-lg leading-relaxed">
        Five interactive blueprints I designed and built to explain the
        machine behind the numbers above.
      </p>

      <div
        aria-label="Blueprint project"
        className="glass mt-6 inline-flex flex-wrap gap-1 rounded-full p-1.5"
        role="tablist"
      >
        {BLUEPRINTS.map((project) => {
          const isActive = project.id === activeId;
          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-200",
                isActive ? "text-ink" : "text-muted-foreground hover:text-cream"
              )}
              id={tabId(project.id)}
              key={project.id}
              onClick={() => setActiveId(project.id)}
              role="tab"
              type="button"
            >
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-gold"
                  layoutId="blueprint-tab-pill"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <BlueprintIcon className="relative z-10 h-3.5 w-3.5" id={project.id} />
              <span className="relative z-10 font-medium">{project.label}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={tabId(active.id)}
        className="glass mt-4 aspect-[8/5] w-full overflow-hidden rounded-2xl border border-gold/25"
        id={panelId}
        role="tabpanel"
      >
        {inView ? (
          <BlueprintFrame key={active.id} project={active} />
        ) : (
          <BlueprintSkeleton />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            animate="show"
            className="text-cream/75 text-sm leading-relaxed"
            exit="exit"
            initial="hidden"
            key={active.id}
            variants={captionSwap}
          >
            {active.caption}
          </motion.p>
        </AnimatePresence>

        <a
          className="group inline-flex shrink-0 items-center gap-1.5 text-gold-light text-sm transition-colors duration-200 hover:text-gold"
          href={active.path}
          rel="noopener"
          target="_blank"
        >
          Open the full walkthrough
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

      <p className="mt-3 text-center text-[0.62rem] text-muted-foreground/70">
        Public sources only. Built to show how the pieces fit, not for
        engineering use.
      </p>
    </motion.div>
  );
}

function BlueprintFrame({ project }: { project: BlueprintProject }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full w-full">
      <iframe
        className="h-full w-full border-0"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        src={`${project.path}?mode=player&autoplay=1&loop=1`}
        title={project.embedTitle}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center bg-ink transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gold" />
          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
            Loading blueprint…
          </p>
        </div>
      </div>
    </div>
  );
}

function BlueprintSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-2 w-2 animate-pulse rounded-full bg-gold/50" />
    </div>
  );
}
