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
        eyebrow="05 · Credentials"
        lede="Formal certifications on the cloud and analytics stack, on top of an accountancy degree — the finance-native foundation."
        title="Certifications & education"
      />

      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CERTS.map((cert, i) => (
              <motion.div
                className="group glass relative overflow-hidden rounded-xl p-5 transition-colors duration-300 hover:border-gold/50"
                custom={i}
                initial="hidden"
                key={cert.name}
                variants={reveal}
                viewport={{ once: true, margin: "-60px" }}
                whileInView="show"
              >
                <div
                  aria-hidden
                  className="-right-6 -top-6 absolute h-16 w-16 rounded-full bg-gold/[0.07] transition-transform duration-500 group-hover:scale-[2.2]"
                />
                <Award aria-hidden className="h-5 w-5 text-gold" />
                <h3 className="mt-3 font-medium text-cream leading-snug">
                  {cert.name}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  {cert.issuer}
                </p>
                <p className="mt-2 font-mono text-[0.7rem] text-gold-light/80">
                  {cert.date}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <ul>
            {EDUCATION.map((edu, i) => (
              <motion.li
                className="border-white/10 border-b py-5 first:pt-0"
                custom={i}
                initial="hidden"
                key={edu.school}
                variants={reveal}
                viewport={{ once: true, margin: "-60px" }}
                whileInView="show"
              >
                <div className="flex items-start gap-3">
                  <GraduationCap
                    aria-hidden
                    className="mt-1 h-5 w-5 shrink-0 text-gold"
                  />
                  <div>
                    <h3 className="font-display text-cream text-lg leading-snug">
                      {edu.school}
                    </h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
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
            custom={3}
            initial="hidden"
            variants={reveal}
            viewport={{ once: true }}
            whileInView="show"
          >
            <p className="eyebrow mt-8 mb-3">Outside of work</p>
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
