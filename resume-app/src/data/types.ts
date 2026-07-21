export interface Project {
  name: string;
  desc: string;
  tags: string[];
}

export interface Metric {
  /** Short label, e.g. "monthly accesses". */
  label: string;
  /** Numeric magnitude used for the in-drawer bar chart. */
  value: number;
  /** Rendered form, e.g. "5k+" — falls back to value when absent. */
  display?: string;
}

export interface Job {
  id: string;
  role: string;
  company: string;
  /** Org / programme line, e.g. "Finance · Amazon Leo (Project Kuiper)". */
  org?: string;
  location: string;
  /** ISO date (first of month). */
  start: string;
  /** ISO date, or null while the role is active. */
  end: string | null;
  /** Tailwind color token name for the company accent (e.g. "amazon"). */
  accent: string;
  /** Short badge shown on the card, e.g. "Satellite broadband". */
  highlight?: string;
  /** One-line card summary — the only prose on the landing surface. */
  tagline: string;
  bullets: string[];
  overview: string;
  projects: Project[];
  metrics: Metric[];
}

export interface SkillPillar {
  id: string;
  name: string;
  /** Years of hands-on use — the radar axis and card bars plot this. */
  years: number;
  /** Short provenance note, e.g. "since 2020". */
  since: string;
  overview: string;
  bullets: string[];
}

export interface Cert {
  name: string;
  issuer: string;
  date: string;
  /** Shown pending user confirmation of the credential. */
  needsConfirmation?: boolean;
}

export interface EducationEntry {
  school: string;
  detail: string;
  location: string;
}

export interface HeroStat {
  label: string;
  value: number;
  suffix?: string;
  note?: string;
}

export interface BlueprintProject {
  id: string;
  /** Tab word, e.g. "Launch". */
  label: string;
  /** Root-absolute path to the standalone project, e.g. "/rocket-blueprint/". */
  path: string;
  /** iframe title — adapted from that project's own embed.html. */
  embedTitle: string;
  /** One short sentence, no disclaimer text (that lives once, outside the loop). */
  caption: string;
}
