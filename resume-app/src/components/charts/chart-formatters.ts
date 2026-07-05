export const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const yearFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
});

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

/** Month-day labels for short ranges, bare years once the span passes ~2 years. */
export function spanAwareDateFmt(spanMs: number): Intl.DateTimeFormat {
  return spanMs > 2 * YEAR_MS ? yearFmt : shortDateFmt;
}

export const weekdayDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const hmsTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("en-US").format;
