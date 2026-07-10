import { animate, createScope, type Scope, stagger } from "animejs";
import { ArrowUpRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import GradientButton from "@/components/kokonutui/gradient-button";
import TypewriterTitle from "@/components/kokonutui/type-writer";
import { ShimmeringText } from "@/components/shimmering-text";
import { OrbitField } from "@/components/hero/OrbitField";
import { StatBand } from "@/components/hero/StatBand";
import { PERSON } from "@/data/resume";

const NAME_WORDS = PERSON.name.split(" ");

/** Blocks that fade in after the name lands. */
const blockReveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function CommandDeck() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!nameRef.current || reducedMotion) return;
    let scope: Scope | undefined;
    scope = createScope({ root: nameRef.current }).add(() => {
      animate(".name-letter", {
        translateY: ["112%", "0%"],
        duration: 950,
        delay: stagger(26, { start: 250 }),
        ease: "outExpo",
      });
    });
    return () => scope?.revert();
  }, [reducedMotion]);

  return (
    <section
      className="relative flex min-h-dvh flex-col overflow-hidden"
      id="deck"
    >
      <OrbitField />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-24 pb-10">
        <motion.div {...blockReveal(0.05)}>
          <span className="glass inline-flex max-w-full items-center gap-2.5 rounded-full px-4 py-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <ShimmeringText
              className="hidden font-medium text-[0.7rem] uppercase tracking-[0.28em] sm:inline-flex [--color:#a29a8a] [--shimmering-color:#e8d5a3]"
              duration={2.4}
              text="Amazon · Business Intelligence Engineer"
            />
            <ShimmeringText
              className="font-medium text-[0.62rem] uppercase tracking-[0.2em] sm:hidden [--color:#a29a8a] [--shimmering-color:#e8d5a3]"
              duration={2.4}
              text="Amazon · BI Engineer"
            />
          </span>
        </motion.div>

        <h1
          className="mt-7 font-display font-black text-[clamp(3.4rem,10vw,8.5rem)] text-cream leading-[0.98] tracking-tight"
          ref={nameRef}
        >
          {NAME_WORDS.map((word) => (
            <span
              className="mr-[0.28em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0"
              key={word}
            >
              <span
                className="name-letter inline-block will-change-transform"
                style={
                  reducedMotion ? undefined : { transform: "translateY(112%)" }
                }
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        <motion.div
          {...blockReveal(0.75)}
          className="mt-5 flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2"
        >
          {/* Fixed one-line height so the rotating tagline never reflows the
              hero as it clears and retypes. */}
          <div className="flex h-8 items-center md:h-9">
            <TypewriterTitle
              className="w-auto"
              sequences={PERSON.taglines.map((text, i) => ({
                text,
                deleteAfter: i < PERSON.taglines.length - 1 || true,
              }))}
              startDelay={1400}
              textClassName="whitespace-nowrap font-sans text-lg md:text-2xl text-gold-light/90 tracking-normal"
              typingSpeed={42}
            />
          </div>
          <span className="hidden h-1 w-1 rounded-full bg-gold/50 md:block" />
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm md:text-base">
            <MapPin aria-hidden className="h-4 w-4 text-gold" />
            {PERSON.location}
          </p>
        </motion.div>

        <motion.div
          {...blockReveal(0.95)}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <GradientButton
            className="h-12 px-6"
            download
            href={`${import.meta.env.BASE_URL}DavidJamieson-Resume.pdf`}
            label="Download resume"
            variant="gold"
          />
          <a
            className="inline-flex h-12 items-center gap-1.5 rounded-lg border border-cream/20 px-6 font-medium text-cream text-sm transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
            href={PERSON.linkedin}
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>

      <motion.div
        {...blockReveal(1.15)}
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:pb-20"
      >
        <StatBand />
      </motion.div>
    </section>
  );
}
