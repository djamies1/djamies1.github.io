import { ArrowUpRight, FileDown, Mail } from "lucide-react";
import { motion } from "motion/react";
import ParticleButton from "@/components/kokonutui/particle-button";
import { PERSON } from "@/data/resume";

export function ContactPanel() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-36" id="contact">
      <div className="glass relative overflow-hidden rounded-3xl px-8 py-14 text-center md:py-20">
        <div
          aria-hidden
          className="-top-1/2 pointer-events-none absolute inset-x-0 h-full bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.12),transparent_65%)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-80px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="eyebrow">06 · Contact</p>
          <h2 className="mt-4 font-display text-5xl text-cream tracking-tight md:text-6xl">
            Open channel.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground leading-relaxed">
            Building something at the intersection of finance, data, and AI?
            The line is live.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <ParticleButton
              className="h-12 border border-gold/50 bg-gold/10 px-6 font-medium text-gold-light hover:bg-gold/20"
              onClick={() => {
                window.location.href = `mailto:${PERSON.email}`;
              }}
              successDuration={800}
            >
              <Mail className="h-4 w-4" />
              {PERSON.email}
            </ParticleButton>
            <a
              className="inline-flex h-12 items-center gap-1.5 rounded-lg border border-cream/20 px-6 font-medium text-cream text-sm transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
              href={PERSON.linkedin}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              className="inline-flex h-12 items-center gap-1.5 rounded-lg border border-cream/20 px-6 font-medium text-cream text-sm transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
              download
              href={`${import.meta.env.BASE_URL}DavidJamieson-Resume.pdf`}
            >
              <FileDown className="h-4 w-4" />
              Résumé PDF
            </a>
          </div>
        </motion.div>
      </div>

      <footer className="mt-14 space-y-2 text-center">
        <p className="text-muted-foreground/80 text-xs leading-relaxed">
          Designed &amp; built by {PERSON.name} — React, TypeScript, Tailwind,
          anime.js, Motion, WebGL. Live Kuiper telemetry via Celestrak.
        </p>
        <p className="text-[0.68rem] text-muted-foreground/50">
          © {new Date().getFullYear()} {PERSON.name} · Kirkland, WA
        </p>
      </footer>
    </section>
  );
}
