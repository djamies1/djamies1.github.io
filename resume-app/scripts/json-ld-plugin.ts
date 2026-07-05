import type { HtmlTagDescriptor, Plugin } from "vite";
import {
  CERTS,
  EDUCATION,
  JOBS,
  PERSON,
  TECH_SKILLS,
  formatRange,
} from "../src/data/resume.ts";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function buildJsonLd(): string {
  const current = JOBS.find((j) => j.end === null);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON.name,
    jobTitle: PERSON.title,
    description: PERSON.summary,
    email: `mailto:${PERSON.email}`,
    url: PERSON.site,
    sameAs: [PERSON.linkedin],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kirkland",
      addressRegion: "WA",
      addressCountry: "US",
    },
    worksFor: current
      ? {
          "@type": "Organization",
          name: current.company,
          department: current.org,
        }
      : undefined,
    alumniOf: EDUCATION.map((e) => ({
      "@type": "CollegeOrUniversity",
      name: e.school,
    })),
    hasCredential: CERTS.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: "certification",
      recognizedBy: { "@type": "Organization", name: c.issuer },
    })),
    knowsAbout: TECH_SKILLS,
  });
}

/**
 * Complete text résumé for non-JS readers (recruiter AI scrapers, curl).
 * Generated from the same data module as the page itself.
 */
function buildNoscript(): string {
  const jobs = JOBS.map(
    (j) => `
      <article>
        <h3>${esc(j.role)} — ${esc(j.company)}</h3>
        <p>${esc(j.org ?? "")} · ${esc(j.location)} · ${esc(formatRange(j))}</p>
        <ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </article>`
  ).join("");

  return `
    <header>
      <h1>${esc(PERSON.name)}</h1>
      <p>${esc(PERSON.title)} · ${esc(PERSON.location)} · ${esc(PERSON.email)}</p>
      <p>${esc(PERSON.summary)}</p>
    </header>
    <section><h2>Professional Experience</h2>${jobs}</section>
    <section><h2>Skills</h2><p>${TECH_SKILLS.map(esc).join(" · ")}</p></section>
    <section><h2>Certifications</h2><ul>${CERTS.map(
      (c) => `<li>${esc(c.name)} — ${esc(c.issuer)} (${esc(c.date)})</li>`
    ).join("")}</ul></section>
    <section><h2>Education</h2><ul>${EDUCATION.map(
      (e) => `<li>${esc(e.school)} — ${esc(e.detail)}</li>`
    ).join("")}</ul></section>`;
}

/** Injects Person JSON-LD and a <noscript> text résumé into index.html at build time. */
export function jsonLdPlugin(): Plugin {
  return {
    name: "resume-json-ld",
    transformIndexHtml(): HtmlTagDescriptor[] {
      return [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: buildJsonLd(),
          injectTo: "head",
        },
        {
          tag: "noscript",
          children: buildNoscript(),
          injectTo: "body",
        },
      ];
    },
  };
}
