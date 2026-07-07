import {
  ArrowLeftRight,
  Bot,
  Calculator,
  ChevronRight,
  type LucideIcon,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { PillarIcon } from "@/components/skills/pillar-icons";
import { SkillDrawer } from "@/components/skills/SkillDrawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SKILL_PILLARS, SPECIALTIES, TECH_SKILLS } from "@/data/resume";
import type { SkillPillar } from "@/data/types";
import { cn } from "@/lib/utils";

const RadarPanel = lazy(() => import("@/components/skills/RadarPanel"));

const SPECIALTY_ICONS: Record<string, LucideIcon> = {
  "ERP Data Migration": ArrowLeftRight,
  "Production GenAI": Bot,
  "Accounting Foundation": Calculator,
  "Stakeholder Leadership": Users,
};

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
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const hoverPillar = SKILL_PILLARS.find((p) => p.id === hoverKey) ?? null;
  // Hover choreography is desktop-only. On touch, a synthetic mouseenter
  // re-render can swallow the tap, so we skip the handlers entirely.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  return (
    <section className="mx-auto max-w-6xl px-6 py-24" id="capabilities">
      <SectionHeading
        eyebrow="04 · Skills"
        lede="Self-assessed scores, so read them as relative strengths. Click any card for the work behind the number."
        title="What I do"
      />

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="mx-auto w-full max-w-[460px]">
          <Suspense fallback={<div className="aspect-square w-full" />}>
            <RadarPanel
              hoverKey={hoverKey}
              onHoverKey={canHover ? setHoverKey : undefined}
            />
          </Suspense>

          {/* hover context readout, synced with radar + cards */}
          <div className="mt-2 hidden min-h-[128px] lg:block">
            <AnimatePresence mode="wait">
              {hoverPillar ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-gold/30 bg-gold/[0.06] p-5"
                  exit={{ opacity: 0, y: -6 }}
                  initial={{ opacity: 0, y: 8 }}
                  key={hoverPillar.id}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2.5">
                    <PillarIcon
                      className="h-5 w-5 text-gold"
                      id={hoverPillar.id}
                    />
                    <h4 className="font-display text-gold-light text-lg">
                      {hoverPillar.name}
                    </h4>
                    <span className="ml-auto font-mono text-gold-light/80 text-sm tabular-nums">
                      {hoverPillar.radar}
                    </span>
                  </div>
                  <p className="mt-2 text-cream/80 text-sm leading-relaxed">
                    {hoverPillar.overview}
                  </p>
                  <p className="mt-2 text-[0.68rem] text-muted-foreground uppercase tracking-[0.14em]">
                    Click for details
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  animate={{ opacity: 1 }}
                  className="px-1 pt-3 text-center text-muted-foreground/70 text-xs uppercase tracking-[0.18em]"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="hint"
                  transition={{ duration: 0.2 }}
                >
                  Hover a card to preview it here
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SKILL_PILLARS.map((pillar, i) => (
            <motion.button
              className={cn(
                "group glass rounded-xl p-5 text-left transition-all duration-300 hover:border-gold/50",
                hoverKey === pillar.id &&
                  "border-gold/60 shadow-[0_0_24px_rgba(201,168,76,0.15)]"
              )}
              custom={i}
              initial="hidden"
              key={pillar.id}
              onClick={() => setOpenPillar(pillar)}
              onMouseEnter={canHover ? () => setHoverKey(pillar.id) : undefined}
              onMouseLeave={canHover ? () => setHoverKey(null) : undefined}
              type="button"
              variants={cardReveal}
              viewport={{ once: true, margin: "-60px" }}
              whileInView="show"
            >
              <div className="flex items-center justify-between">
                <PillarIcon className="h-5 w-5 text-gold" id={pillar.id} />
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
        <p className="eyebrow mb-5">Specialties</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.map((s, i) => {
            const Icon = SPECIALTY_ICONS[s.title];
            return (
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
              {Icon ? (
                <Icon aria-hidden className="h-6 w-6 text-gold" />
              ) : null}
              <h3 className="mt-3 font-display text-gold-light text-xl">
                {s.title}
              </h3>
              <p className="mt-2 text-cream/75 text-sm leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
            );
          })}
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
