import { JOBS } from "@/data/resume";
import type { Job } from "@/data/types";

/** Jobs oldest → newest for timeline traversal. */
export const TIMELINE_JOBS: Job[] = [...JOBS].reverse();

export const DOMAIN_START = new Date("2013-05-01T00:00:00");

export const domainEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/** 0–1 position of a date across the career time domain. */
export function fracOf(date: Date): number {
  const start = DOMAIN_START.getTime();
  const end = domainEnd().getTime();
  return Math.min(1, Math.max(0, (date.getTime() - start) / (end - start)));
}

export const jobStart = (j: Job) => new Date(`${j.start}T00:00:00`);
export const jobEnd = (j: Job) =>
  j.end ? new Date(`${j.end}T00:00:00`) : domainEnd();

/** Needle rest position for a role — centre of its tenure. */
export function jobMidFrac(j: Job): number {
  return fracOf(
    new Date((jobStart(j).getTime() + jobEnd(j).getTime()) / 2)
  );
}

/*
 * Stylised "scope index" — a hand-tuned magnitude for how broad each role's
 * remit was. Powers the area curve only; labelled as stylised in the UI.
 */
const SCOPE_LEVELS: Record<string, number> = {
  "inspired-led": 1.3,
  falck: 2.2,
  "pac-fpa": 3.1,
  "pac-bi": 4.1,
  "amazon-pxt": 5.2,
  "amazon-leo": 6.6,
};

const EY_BUMP = 0.35;

export interface ScopePoint {
  date: string;
  scope: number;
  [key: string]: unknown;
}

/** Monthly scope-index series across the whole career. */
export function buildScopeSeries(): ScopePoint[] {
  const points: ScopePoint[] = [];
  const end = domainEnd();
  const primaries = TIMELINE_JOBS.filter((j) => j.id !== "ey");
  const ey = TIMELINE_JOBS.find((j) => j.id === "ey");

  const cursor = new Date(DOMAIN_START);
  while (cursor <= end) {
    const active = primaries.filter(
      (j) => jobStart(j) <= cursor && cursor <= jobEnd(j)
    );
    // Latest-starting active role wins the month.
    const job = active.at(-1);
    if (job) {
      const s = jobStart(job).getTime();
      const e = jobEnd(job).getTime();
      const t = e > s ? (cursor.getTime() - s) / (e - s) : 0;
      let scope = SCOPE_LEVELS[job.id] + 0.5 * t;
      if (ey && jobStart(ey) <= cursor && cursor <= jobEnd(ey)) {
        scope += EY_BUMP;
      }
      points.push({
        date: cursor.toISOString().slice(0, 10),
        scope: Number(scope.toFixed(2)),
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

export interface TenureBand {
  job: Job;
  left: number; // 0–1
  width: number; // 0–1
}

/** Company tenure bands (EY rendered as a marker, not a band). */
export function buildBands(): TenureBand[] {
  return TIMELINE_JOBS.filter((j) => j.id !== "ey").map((job) => {
    const left = fracOf(jobStart(job));
    return { job, left, width: fracOf(jobEnd(job)) - left };
  });
}
