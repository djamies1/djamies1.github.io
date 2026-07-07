import { Award, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { CERTS, EDUCATION, INTERESTS } from "@/data/resume";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.07 * i,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function Credentials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24" id="credentials">
      <SectionHeading
        eyebrow="05 · Background"
        lede="An accountancy degree and a data warehousing certificate underpin the engineering. The finance-native foundation came first."
        title="Education & certifications"
      />

      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <ul>
            {EDUCATION.map((edu, i) => (
              <motion.li
                className="border-white/10 border-b py-6 first:pt-0"
                custom={i}
                initial="hidden"
                key={edu.school}
                variants={reveal}
                viewport={{ once: true, margin: "-60px" }}
                whileInView="show"
              >
                <div className="flex items-start gap-4">
                  <GraduationCap
                    aria-hidden
                    className="mt-1.5 h-6 w-6 shrink-0 text-gold"
                  />
                  <div>
                    <h3 className="font-display text-cream text-xl leading-snug md:text-2xl">
                      {edu.school}
                    </h3>
                    <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                      {edu.detail}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground/70 uppercase tracking-[0.14em]">
                      {edu.location}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>

          <motion.div
            custom={2}
            initial="hidden"
            variants={reveal}
            viewport={{ once: true }}
            whileInView="show"
          >
            <p className="eyebrow mt-8 mb-3">Certifications</p>
            <ul className="flex flex-wrap gap-2">
              {CERTS.map((cert) => (
                <li
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-cream/75 text-xs transition-colors duration-300 hover:border-gold/40 hover:text-gold-light"
                  key={cert.name}
                >
                  <Award aria-hidden className="h-3 w-3 text-gold/70" />
                  {cert.name}
                  <span className="text-muted-foreground/70">
                    · {cert.date}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div>
          <motion.div
            custom={1}
            initial="hidden"
            variants={reveal}
            viewport={{ once: true }}
            whileInView="show"
          >
            <p className="eyebrow mb-3">Outside of work</p>
            <ul className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <li
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-cream/75 text-xs"
                  key={interest.label}
                >
                  <span aria-hidden>{interest.icon}</span>
                  {interest.label}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
