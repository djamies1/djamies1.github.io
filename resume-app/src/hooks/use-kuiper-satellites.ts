import { useEffect, useState } from "react";

/*
 * Live Kuiper constellation telemetry — ported from the v1 resume page.
 * Fetches TLEs from Celestrak (with CORS-proxy fallbacks), propagates
 * orbital positions with satellite.js every 3 s.
 */

const EARTH_R_KM = 6371;
const CACHE_KEY = "kuiper_tle_mini_v1";
const CACHE_TTL_MS = 15 * 60 * 1000;
const CELESTRAK =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=kuiper&FORMAT=tle";
const TLE_URLS = [
  CELESTRAK,
  `https://corsproxy.io/?${CELESTRAK}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(CELESTRAK)}`,
];

export interface SatPoint {
  name: string;
  lat: number;
  lng: number;
  /** Altitude in globe radii (globe.gl convention). */
  alt: number;
  /** Altitude in km, for telemetry. */
  altKm: number;
}

export type KuiperStatus = "idle" | "loading" | "live" | "offline";

interface SatRecord extends SatPoint {
  satrec: unknown;
}

type SatelliteLib = typeof import("satellite.js");

async function fetchTLEs(): Promise<string | null> {
  try {
    const hit = sessionStorage.getItem(CACHE_KEY);
    if (hit) {
      const { data, ts } = JSON.parse(hit) as { data: string; ts: number };
      if (Date.now() - ts < CACHE_TTL_MS) return data;
    }
  } catch {
    /* cache unavailable */
  }

  for (const url of TLE_URLS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 100) continue;
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: text, ts: Date.now() })
        );
      } catch {
        /* cache unavailable */
      }
      return text;
    } catch {
      /* try next mirror */
    }
  }
  return null;
}

function parseTLEs(tleText: string, sat: SatelliteLib): SatRecord[] {
  const lines = tleText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const sats: SatRecord[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    try {
      const satrec = sat.twoline2satrec(lines[i + 1], lines[i + 2]);
      sats.push({ name: lines[i], satrec, lat: 0, lng: 0, alt: 0, altKm: 0 });
    } catch {
      /* skip malformed entry */
    }
  }
  return sats;
}

function propagateAll(sats: SatRecord[], sat: SatelliteLib): void {
  const now = new Date();
  const gmst = sat.gstime(now);
  for (const d of sats) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: satellite.js record type is opaque here
      const eci = sat.propagate(d.satrec as any, now);
      if (eci && typeof eci.position === "object" && eci.position) {
        const geo = sat.eciToGeodetic(eci.position, gmst);
        d.lat = sat.radiansToDegrees(geo.latitude);
        d.lng = sat.radiansToDegrees(geo.longitude);
        d.altKm = geo.height;
        d.alt = geo.height / EARTH_R_KM;
      }
    } catch {
      /* keep last-known position */
    }
  }
}

export interface KuiperTelemetry {
  status: KuiperStatus;
  points: SatPoint[];
  count: number;
  meanAltKm: number;
}

export function useKuiperSatellites(enabled: boolean): KuiperTelemetry {
  const [status, setStatus] = useState<KuiperStatus>("idle");
  const [points, setPoints] = useState<SatPoint[]>([]);
  const [meanAltKm, setMeanAltKm] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      setStatus("loading");
      try {
        const sat = await import("satellite.js");
        const tleText = await fetchTLEs();
        if (cancelled) return;
        if (!tleText) {
          setStatus("offline");
          return;
        }
        const sats = parseTLEs(tleText, sat);
        if (sats.length === 0) {
          setStatus("offline");
          return;
        }

        const publish = () => {
          propagateAll(sats, sat);
          const valid = sats.filter((s) => s.altKm > 0);
          setPoints(valid.map(({ satrec: _satrec, ...p }) => p));
          if (valid.length) {
            setMeanAltKm(
              valid.reduce((sum, s) => sum + s.altKm, 0) / valid.length
            );
          }
        };

        publish();
        setStatus("live");
        interval = setInterval(() => {
          if (!cancelled) publish();
        }, 3000);
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [enabled]);

  return { status, points, count: points.length, meanAltKm };
}
