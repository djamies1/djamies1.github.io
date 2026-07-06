import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { SkillDrawer } from "@/components/skills/SkillDrawer";
import { SKILL_PILLARS, SPECIALTIES, TECH_SKILLS } from "@/data/resume";
import type { SkillPillar } from "@/data/types";

const RadarPanel = lazy(() => import("@/components/skills/RadarPanel"));

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.06 * i,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function Capabilities() {
  const [openPillar, setOpenPillar] = useState<SkillPillar | null>(null);

  return (
    <section className="mx-auto max-w-6xl px-6 py-24" id="capabilities">
      <SectionHeading
        eyebrow="04 · Skills"
        lede="Six disciplines, one practitioner — from warehouse schemas to RAG pipelines. Open any pillar for the track record."
        title="Core capabilities"
      />

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="mx-auto w-full max-w-[460px]">
          <Suspense fallback={<div className="aspect-square w-full" />}>
            <RadarPanel />
          </Suspense>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SKILL_PILLARS.map((pillar, i) => (
            <motion.button
              className="group glass rounded-xl p-5 text-left transition-colors duration-300 hover:border-gold/50"
              custom={i}
              initial="hidden"
              key={pillar.id}
              onClick={() => setOpenPillar(pillar)}
              type="button"
              variants={cardReveal}
              viewport={{ once: true, margin: "-60px" }}
              whileInView="show"
            >
              <div className="flex items-center justify-between">
                <span aria-hidden className="text-xl">
                  {pillar.icon}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
              </div>
              <h3 className="mt-3 font-display text-cream text-lg leading-snug">
                {pillar.name}
              </h3>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold-light"
                    initial={{ width: 0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.3 + 0.06 * i,
                      ease: "easeOut",
                    }}
                    viewport={{ once: true }}
                    whileInView={{ width: `${pillar.radar}%` }}
                  />
                </div>
                <span className="font-mono text-[0.7rem] text-gold-light/80 tabular-nums">
                  {pillar.radar}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <p className="eyebrow mb-5">Standout strengths</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.map((s, i) => (
            <motion.div
              className="group relative overflow-hidden rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.07] to-transparent p-6 transition-colors duration-300 hover:border-gold/50"
              custom={i}
              initial="hidden"
              key={s.title}
              variants={cardReveal}
              viewport={{ once: true, margin: "-60px" }}
              whileInView="show"
            >
              <div
                aria-hidden
                className="-right-8 -top-8 absolute h-20 w-20 rounded-full bg-gold/[0.08] transition-transform duration-500 group-hover:scale-[2]"
              />
              <span aria-hidden className="text-2xl">
                {s.icon}
              </span>
              <h3 className="mt-3 font-display text-gold-light text-xl">
                {s.title}
              </h3>
              <p className="mt-2 text-cream/75 text-sm leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <p className="eyebrow mb-4">Tools &amp; technologies</p>
        <ul className="flex flex-wrap gap-2">
          {TECH_SKILLS.map((t) => (
            <li
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-cream/70 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold-light"
              key={t}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      <SkillDrawer onClose={() => setOpenPillar(null)} pillar={openPillar} />
    </section>
  );
}
