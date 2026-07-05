import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { SkillDrawer } from "@/components/skills/SkillDrawer";
import { SKILL_PILLARS, TECH_SKILLS } from "@/data/resume";
import type { SkillPillar } from "@/data/types";

const RADAR_METRICS = SKILL_PILLARS.map((p) => ({
  key: p.id,
  label: p.name,
}));

const RADAR_DATA = [
  {
    label: "Capability",
    color: "#c9a84c",
    values: Object.fromEntries(SKILL_PILLARS.map((p) => [p.id, p.radar])),
  },
];

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
        eyebrow="04 · Capabilities"
        lede="Six disciplines, one operator — from warehouse schemas to RAG pipelines. Open a pillar for the field record."
        title="Systems check"
      />

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="mx-auto w-full max-w-[460px]">
          <RadarChart
            data={RADAR_DATA}
            levels={4}
            margin={90}
            metrics={RADAR_METRICS}
          >
            <RadarGrid />
            <RadarAxis />
            <RadarLabels />
            <RadarArea index={0} />
          </RadarChart>
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

      <div className="mt-14">
        <p className="eyebrow mb-4">Instrument rack</p>
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
