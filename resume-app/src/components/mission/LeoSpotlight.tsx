import { animate, utils } from "animejs";
import { ChevronRight } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import MatrixText from "@/components/kokonutui/matrix-text";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { RoleDrawer } from "@/components/timeline/RoleDrawer";
import { useInView } from "@/hooks/use-in-view";
import { JOBS, LEO_KPIS } from "@/data/resume";
import type { Job } from "@/data/types";

const KuiperOps = lazy(() => import("@/components/mission/KuiperOps"));

const LEO_JOB = JOBS.find((j) => j.id === "amazon-leo");

const item = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: 0.1 + i * 0.09,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

/** Count-up KPI tiles — the whole Leo story in four numbers. */
function LeoKpis() {
  const rootRef = useRef<HTMLDListElement>(null);
  const inView = useInView(rootRef, "-60px");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !inView) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-count]");
    if (reducedMotion) {
      for (const el of nodes) el.textContent = el.dataset.count ?? "";
      return;
    }
    const animations = Array.from(nodes, (el, i) => {
      const target = Number(el.dataset.count);
      const proxy = { n: 0 };
      return animate(proxy, {
        n: target,
        duration: 1400,
        delay: 200 + i * 130,
        ease: "outExpo",
        modifier: utils.round(0),
        onUpdate: () => {
          el.textContent = String(proxy.n);
        },
      });
    });
    return () => {
      for (const a of animations) a.cancel();
    };
  }, [inView, reducedMotion]);

  return (
    <dl className="grid grid-cols-2 gap-3" ref={rootRef}>
      {LEO_KPIS.map((kpi) => (
        <div className="glass rounded-xl px-5 py-4" key={kpi.label}>
          <dd className="font-display text-3xl text-gold-light md:text-4xl">
            {kpi.prefix ?? ""}
            <span data-count={kpi.value}>0</span>
          </dd>
          <dt className="mt-1 text-[0.68rem] text-muted-foreground uppercase tracking-[0.16em]">
            {kpi.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export function LeoSpotlight() {
  const sectionRef = useRef<HTMLElement>(null);
  const globeInView = useInView(sectionRef, "600px");
  const [dossier, setDossier] = useState<Job | null>(null);

  return (
    <section
      className="mx-auto max-w-6xl px-6 py-24"
      id="mission"
      ref={sectionRef}
    >
      <SectionHeading
        eyebrow="03 · Current role"
        lede="The finance analytics platform behind Amazon's satellite broadband constellation, Project Kuiper. One platform, eight domains."
        title={
          <MatrixText
            charClassName="font-mono text-4xl tracking-tight md:text-5xl"
            className="text-cream dark:text-cream"
            initialDelay={400}
            text="AMAZON LEO"
          />
        }
      />

      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.p
            className="max-w-xl text-cream/85 text-lg leading-relaxed"
            custom={0}
            initial="hidden"
            variants={item}
            viewport={{ once: true, margin: "-80px" }}
            whileInView="show"
          >
            I design, build, and operate the finance org's production
            Python/Flask analytics platform, including a RAG knowledge
            assistant adopted org-wide.
          </motion.p>

          <motion.div
            className="mt-7"
            custom={1}
            initial="hidden"
            variants={item}
            viewport={{ once: true, margin: "-80px" }}
            whileInView="show"
          >
            <LeoKpis />
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            variants={item}
            viewport={{ once: true }}
            whileInView="show"
          >
            <p className="mt-5 text-muted-foreground text-sm leading-relaxed">
              Also founded the org's monthly Analytics &amp; AI forum, and
              serve as primary technical advisor to partner engineering and
              data teams.
            </p>
            <button
              className="group mt-6 inline-flex items-center gap-2 rounded-lg border border-gold/40 px-5 py-2.5 font-medium text-gold-light text-sm transition-all duration-300 hover:border-gold hover:bg-gold/10"
              onClick={() => setDossier(LEO_JOB ?? null)}
              type="button"
            >
              Full role details
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        </div>

        <div>
          {globeInView ? (
            <Suspense fallback={<GlobeSkeleton />}>
              <KuiperOps />
            </Suspense>
          ) : (
            <GlobeSkeleton />
          )}
        </div>
      </div>

      <RoleDrawer job={dossier} onClose={() => setDossier(null)} />
    </section>
  );
}

function GlobeSkeleton() {
  return (
    <div className="relative aspect-[1/0.88] w-full overflow-hidden rounded-2xl border border-gold/25 bg-black/40">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 animate-pulse rounded-full border border-gold/30 bg-ink-3" />
      </div>
      <p className="absolute bottom-4 w-full text-center text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
        Initialising orbital display…
      </p>
    </div>
  );
}
