import {
  CERTS,
  EDUCATION,
  JOBS,
  PERSON,
  TECH_SKILLS,
  formatRange,
} from "@/data/resume";

/**
 * Print-only rendition: a clean single-column text résumé generated from the
 * same data module as the interactive page. Hidden on screen.
 */
export function PrintResume() {
  return (
    <div className="hidden print:block" id="print-resume">
      <header>
        <h1 className="font-display text-3xl">{PERSON.name}</h1>
        <p className="mt-1 text-sm">
          {PERSON.title} · {PERSON.location} · {PERSON.email} ·{" "}
          {PERSON.linkedin}
        </p>
        <p className="mt-2 text-sm">{PERSON.summary}</p>
      </header>

      <section className="mt-6">
        <h2 className="border-black border-b font-semibold text-base uppercase tracking-wide">
          Professional Experience
        </h2>
        {JOBS.map((job) => (
          <article className="mt-4" key={job.id}>
            <h3 className="font-semibold text-sm">
              {job.role} — {job.company}
            </h3>
            <p className="text-xs">
              {job.org ? `${job.org} · ` : ""}
              {job.location} · {formatRange(job)}
            </p>
            <ul className="mt-1.5 ml-4 list-disc space-y-1 text-xs leading-snug">
              {job.bullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="border-black border-b font-semibold text-base uppercase tracking-wide">
          Skills
        </h2>
        <p className="mt-2 text-xs leading-relaxed">
          {TECH_SKILLS.join(" · ")}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="border-black border-b font-semibold text-base uppercase tracking-wide">
          Certifications
        </h2>
        <ul className="mt-2 space-y-1 text-xs">
          {CERTS.map((c) => (
            <li key={c.name}>
              {c.name} — {c.issuer} ({c.date})
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="border-black border-b font-semibold text-base uppercase tracking-wide">
          Education
        </h2>
        <ul className="mt-2 space-y-1 text-xs">
          {EDUCATION.map((e) => (
            <li key={e.school}>
              <span className="font-semibold">{e.school}</span> — {e.detail} (
              {e.location})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
