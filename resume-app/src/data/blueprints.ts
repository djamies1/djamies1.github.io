import type { BlueprintProject } from "./types.ts";

/*
 * Metadata for the standalone blueprint scrollytelling projects (sibling
 * folders at the repo root, not part of this Vite app) shown by
 * BlueprintShowcase. Kept separate from resume.ts on purpose: this isn't
 * resume content, and isn't read by PrintResume or the JSON-LD build plugin
 * the way resume.ts is. Order: the five object/spectrum sheets first
 * (launch, satellite, gateway, terminal, spectrum), then the six
 * system-and-analysis sheets — the network, the data path, why LEO,
 * deployment, the Starlink comparison, and the public-estimates economics.
 */
export const BLUEPRINTS: BlueprintProject[] = [
  {
    id: "rocket",
    label: "Launch",
    path: "/rocket-blueprint/",
    embedTitle: "New Glenn launch vehicle — animated blueprint (auto-playing)",
    caption: "How New Glenn lifts a batch of Leo satellites to orbit.",
  },
  {
    id: "satellite",
    label: "Satellite",
    path: "/satellite-blueprint/",
    embedTitle: "Generic Amazon Leo satellite — animated blueprint (auto-playing)",
    caption: "Inside a Leo satellite, and how it talks to the ground.",
  },
  {
    id: "gateway",
    label: "Gateway",
    path: "/gateway-blueprint/",
    embedTitle:
      "Generic Amazon Leo ground gateway — animated blueprint (auto-playing)",
    caption: "The ground stations that link the constellation to the internet.",
  },
  {
    id: "terminal",
    label: "Terminal",
    path: "/terminal-blueprint/",
    embedTitle:
      "Generic Amazon Leo customer terminal — animated blueprint (auto-playing)",
    caption: "How a customer's terminal finds and locks onto a satellite pass.",
  },
  {
    id: "spectrum",
    label: "Spectrum",
    path: "/spectrum-blueprint/",
    embedTitle:
      "How Amazon Leo uses radio spectrum — animated blueprint (auto-playing)",
    caption:
      "The invisible layer: the radio bands Leo runs on, and how they're licensed.",
  },
  {
    id: "constellation",
    label: "Constellation",
    path: "/constellation-blueprint/",
    embedTitle:
      "How the Amazon Leo constellation forms one network — animated blueprint (auto-playing)",
    caption:
      "Three shells, ninety-eight planes, and a laser mesh — the whole network in orbit.",
  },
  {
    id: "datapath",
    label: "Data path",
    path: "/datapath-blueprint/",
    embedTitle:
      "How data travels end-to-end on Amazon Leo — animated blueprint (auto-playing)",
    caption:
      "One packet's round trip: terminal → satellite → laser mesh → gateway → AWS.",
  },
  {
    id: "latency",
    label: "Why LEO",
    path: "/latency-blueprint/",
    embedTitle:
      "Why low Earth orbit lowers latency and needs a constellation — animated blueprint (auto-playing)",
    caption:
      "Why it all flies low: altitude sets latency, and the trade-offs that follow.",
  },
  {
    id: "deployment",
    label: "Deployment",
    path: "/deployment-blueprint/",
    embedTitle:
      "How Amazon Leo gets deployed against the FCC clock — animated blueprint (auto-playing)",
    caption:
      "Building 3,236 satellites against a use-it-or-lose-it FCC deadline.",
  },
  {
    id: "comparison",
    label: "vs Starlink",
    path: "/comparison-blueprint/",
    embedTitle:
      "Amazon Leo vs Starlink — a public architecture comparison, animated blueprint (auto-playing)",
    caption:
      "Two bets on the same idea: Amazon Leo and Starlink, side by side.",
  },
  {
    id: "economics",
    label: "Economics",
    path: "/economics-blueprint/",
    embedTitle:
      "The rough public economics of a LEO network — animated blueprint (auto-playing)",
    caption:
      "The shape of the bet: heavy capex now, recurring revenue later. Public estimates only.",
  },
];
