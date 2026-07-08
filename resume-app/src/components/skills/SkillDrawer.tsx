import { X } from "lucide-react";
import { motion } from "motion/react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PillarIcon } from "@/components/skills/pillar-icons";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PILLAR_MAX_YEARS } from "@/data/resume";
import type { SkillPillar } from "@/data/types";

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface SkillDrawerProps {
  pillar: SkillPillar | null;
  onClose: () => void;
}

/** Deep-dive drawer for a capability pillar. */
export function SkillDrawer({ pillar, onClose }: SkillDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Drawer
      direction={isDesktop ? "right" : "bottom"}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={pillar !== null}
    >
      <DrawerContent className="border-gold/20 bg-ink-2 data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=right]:sm:max-w-xl">
        {pillar ? (
          <motion.div
            animate="show"
            className="overflow-y-auto overscroll-contain px-6 pt-4 pb-10 md:px-8 md:pt-8"
            initial="hidden"
            variants={listStagger}
          >
            <DrawerClose
              aria-label="Close capability details"
              className="absolute top-3 right-3 z-10 rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </DrawerClose>

            <motion.header variants={item}>
              <p className="eyebrow">Skill detail</p>
              <DrawerTitle className="mt-3 flex items-center gap-3 font-display text-3xl text-cream leading-tight">
                <PillarIcon className="h-6 w-6 text-gold" id={pillar.id} />
                {pillar.name}
              </DrawerTitle>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    animate={{
                      width: `${(pillar.years / PILLAR_MAX_YEARS) * 100}%`,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                    initial={{ width: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  />
                </div>
                <div className="text-right">
                  <span className="font-display text-gold-light text-lg">
                    {pillar.years} yrs
                  </span>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {pillar.since}
                  </p>
                </div>
              </div>
            </motion.header>

            <motion.div variants={item}>
              <DrawerDescription className="mt-6 border-gold/40 border-l-2 pl-4 text-base text-cream/85 leading-relaxed">
                {pillar.overview}
              </DrawerDescription>
            </motion.div>

            <motion.h3 className="eyebrow mt-9 mb-4" variants={item}>
              Where I've used it
            </motion.h3>
            <ul className="space-y-3">
              {pillar.bullets.map((b) => (
                <motion.li
                  className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-cream/80 text-sm leading-relaxed"
                  key={b.slice(0, 40)}
                  variants={item}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 font-mono text-gold text-xs"
                  >
                    ▸
                  </span>
                  {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
