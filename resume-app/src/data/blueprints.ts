import type { BlueprintProject } from "./types.ts";

/*
 * Metadata for the four standalone blueprint scrollytelling projects
 * (sibling folders at the repo root, not part of this Vite app) shown by
 * BlueprintShowcase. Kept separate from resume.ts on purpose: this isn't
 * resume content, and isn't read by PrintResume or the JSON-LD build plugin
 * the way resume.ts is. Order is the narrative one: launch, orbit, ground,
 * rooftop.
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
];
