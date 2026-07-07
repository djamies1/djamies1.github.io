import { X } from "lucide-react";
import { motion } from "motion/react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatRange } from "@/data/resume";
import type { Job } from "@/data/types";

const ACCENT_TEXT: Record<string, string> = {
  amazon: "text-amazon",
  pac: "text-pac",
  falck: "text-falck",
  led: "text-led",
  ey: "text-ey",
};

const ACCENT_BG: Record<string, string> = {
  amazon: "bg-amazon",
  pac: "bg-pac",
  falck: "bg-falck",
  led: "bg-led",
  ey: "bg-ey",
};

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface RoleDrawerProps {
  job: Job | null;
  onClose: () => void;
}

/** Slide-in mission dossier for a role — right sheet on desktop, bottom on mobile. */
export function RoleDrawer({ job, onClose }: RoleDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Drawer
      direction={isDesktop ? "right" : "bottom"}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={job !== null}
    >
      <DrawerContent className="border-gold/20 bg-ink-2 data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=right]:sm:max-w-2xl">
        {job ? (
          <motion.div
            animate="show"
            className="overflow-y-auto overscroll-contain px-6 pt-4 pb-10 md:px-8 md:pt-8"
            initial="hidden"
            variants={listStagger}
          >
            <DrawerClose
              aria-label="Close role details"
              className="absolute top-3 right-3 z-10 rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </DrawerClose>

            <motion.header variants={item}>
              <p className="eyebrow flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${ACCENT_BG[job.accent] ?? "bg-gold"}`}
                />
                Role detail
              </p>
              <DrawerTitle className="mt-3 font-display text-3xl text-cream leading-tight">
                {job.role}
              </DrawerTitle>
              <p
                className={`mt-1.5 font-medium text-base ${ACCENT_TEXT[job.accent] ?? "text-gold"}`}
              >
                {job.company}
                {job.org ? (
                  <span className="text-muted-foreground"> · {job.org}</span>
                ) : null}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {formatRange(job)} · {job.location}
              </p>
            </motion.header>

            <motion.div variants={item}>
              <DrawerDescription className="mt-6 border-gold/40 border-l-2 pl-4 text-base text-cream/85 leading-relaxed">
                {job.overview}
              </DrawerDescription>
            </motion.div>

            {job.metrics.length > 0 && (
              <motion.dl
                className="mt-7 grid grid-cols-2 gap-3"
                variants={item}
              >
                {job.metrics.map((m) => (
                  <div className="glass rounded-lg px-4 py-3" key={m.label}>
                    <dd className="font-display text-2xl text-gold-light">
                      {m.display ?? m.value}
                    </dd>
                    <dt className="mt-0.5 text-[0.68rem] text-muted-foreground uppercase tracking-[0.14em]">
                      {m.label}
                    </dt>
                  </div>
                ))}
              </motion.dl>
            )}

            {job.projects.length > 0 && (
              <motion.h3
                className="eyebrow mt-9 mb-4"
                variants={item}
              >
                Key projects
              </motion.h3>
            )}
            <div className="space-y-4">
              {job.projects.map((p) => (
                <motion.article
                  className="rounded-xl border border-white/8 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-gold/30"
                  key={p.name}
                  variants={item}
                >
                  <h4 className="font-display text-gold-light text-lg">
                    {p.name}
                  </h4>
                  <p className="mt-1.5 text-cream/75 text-sm leading-relaxed">
                    {p.desc}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <li
                        className="rounded-full border border-gold/25 px-2.5 py-0.5 text-[0.68rem] text-gold-light/90"
                        key={t}
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </motion.div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
