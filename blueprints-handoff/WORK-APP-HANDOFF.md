# Blueprint animations → production app: handoff

**For:** the coding agent working in the production app.
**Goal:** embed eleven self-contained "blueprint" animations into the app's views as
auto-playing widgets with built-in **play / fast-forward / scrub** controls — the same
way they're embedded in the personal résumé site. **No rewrite required:** each blueprint
is a static folder you drop in and load in an `<iframe>`.

The app is **React / Next.js**, so the worked example below is React. But the actual
integration surface is just *an iframe with one specific URL* — framework-agnostic. If you
only read one section, read **[3] The embed contract**.

---

## [0] TL;DR (the 60-second version)

1. Get the eleven `*-blueprint/` folders (§1) and drop them into the app's static assets,
   e.g. `public/blueprints/rocket-blueprint/`, …
2. Render an iframe pointing at each one in **player mode**:
   ```html
   <iframe
     src="/blueprints/spectrum-blueprint/index.html?mode=player&autoplay=1&loop=1"
     title="How Amazon Leo uses radio spectrum — animated blueprint"
     loading="lazy"
     style="width:100%; aspect-ratio:8/5; border:0"></iframe>
   ```
   That's the whole contract. The animation auto-plays, loops, and shows its own
   transport bar (Restart · Prev · REW · ▶ · FF · Next + speed + a scrubbable progress
   bar). Size the container **8:5**.
3. Prefer the React components in §4 (lazy-mount, one-iframe-at-a-time, tabbed showcase).
4. **Do not** modify the blueprint sheets or strip their "public sources only" chrome —
   see **[6] Compliance**. That framing is why these are safe to put in an internal app.

---

## [1] The eleven blueprints

Each is a cyanotype engineering-drawing animation (inline SVG + GSAP), part of one matched
set. All content is **public** (FCC / ITU regulatory record, trade press) — representative,
schematic, not internal.

| id | folder | tab label | explains | live reference |
|----|--------|-----------|----------|----------------|
| `rocket` | `rocket-blueprint/` | Launch | How New Glenn lifts a batch of Leo satellites to orbit. | https://djamies1.github.io/rocket-blueprint/ |
| `satellite` | `satellite-blueprint/` | Satellite | Inside a Leo satellite, and how it talks to the ground. | https://djamies1.github.io/satellite-blueprint/ |
| `gateway` | `gateway-blueprint/` | Gateway | The ground stations that link the constellation to the internet. | https://djamies1.github.io/gateway-blueprint/ |
| `terminal` | `terminal-blueprint/` | Terminal | How a customer's terminal finds and locks onto a satellite pass. | https://djamies1.github.io/terminal-blueprint/ |
| `spectrum` | `spectrum-blueprint/` | Spectrum | The invisible layer: the radio bands Leo runs on, and how they're licensed. | https://djamies1.github.io/spectrum-blueprint/ |
| `constellation` | `constellation-blueprint/` | Constellation | Three shells, 98 planes, and a laser mesh — the whole network in orbit. | https://djamies1.github.io/constellation-blueprint/ |
| `datapath` | `datapath-blueprint/` | Data path | One packet's round trip: terminal → satellite → laser mesh → gateway → AWS. | https://djamies1.github.io/datapath-blueprint/ |
| `latency` | `latency-blueprint/` | Why LEO | Why it all flies low: altitude sets latency, and the trade-offs that follow. | https://djamies1.github.io/latency-blueprint/ |
| `deployment` | `deployment-blueprint/` | Deployment | Building 3,236 satellites against a use-it-or-lose-it FCC deadline. | https://djamies1.github.io/deployment-blueprint/ |
| `comparison` | `comparison-blueprint/` | vs Starlink | Amazon Leo and Starlink, side by side (public comparison). | https://djamies1.github.io/comparison-blueprint/ |
| `economics` | `economics-blueprint/` | Economics | The rough economics of the bet — public estimates only, illustrative. | https://djamies1.github.io/economics-blueprint/ |

**Each folder is self-contained and has _no build step_:**

```
<name>-blueprint/
├── index.html                    # the SVG sheet + scaffold
├── styles.css
├── js/  data.js drawing.js timeline.js ui.js main.js   # ES modules, relative imports
├── vendor/  gsap.min.js  ScrollTrigger.min.js          # GSAP is vendored, not a CDN
├── fonts/  *.woff2  LICENSE-OFL.txt                     # self-hosted fonts
├── embed.html                    # a throwaway demo of the two embed patterns
└── HANDOFF.md                    # notes on THAT blueprint's internals
```

Everything is referenced with **relative paths** (`./js/…`, `./vendor/…`, `./fonts/…`) and
there are **zero external / CDN / network requests at runtime** (verified). That's what makes
these safe to serve inside a locked-down corporate app behind a strict CSP.

---

## [2] Getting the code

The blueprints live in a **public** GitHub repo: **`djamies1/djamies1.github.io`**
(branch `main`). *(This handoff document lives in the same repo, under
`blueprints-handoff/`.)* Two ways to get just the eleven folders — pick whichever your
environment allows.

### (a) Primary — pull only the eleven folders from the public repo

`degit` grabs a subfolder with no git history — one command per blueprint, straight into
the app's static dir:

```bash
npx degit djamies1/djamies1.github.io/rocket-blueprint    public/blueprints/rocket-blueprint
npx degit djamies1/djamies1.github.io/satellite-blueprint public/blueprints/satellite-blueprint
npx degit djamies1/djamies1.github.io/gateway-blueprint   public/blueprints/gateway-blueprint
npx degit djamies1/djamies1.github.io/terminal-blueprint  public/blueprints/terminal-blueprint
npx degit djamies1/djamies1.github.io/spectrum-blueprint  public/blueprints/spectrum-blueprint
npx degit djamies1/djamies1.github.io/constellation-blueprint public/blueprints/constellation-blueprint
npx degit djamies1/djamies1.github.io/datapath-blueprint      public/blueprints/datapath-blueprint
npx degit djamies1/djamies1.github.io/latency-blueprint       public/blueprints/latency-blueprint
npx degit djamies1/djamies1.github.io/deployment-blueprint    public/blueprints/deployment-blueprint
npx degit djamies1/djamies1.github.io/comparison-blueprint    public/blueprints/comparison-blueprint
npx degit djamies1/djamies1.github.io/economics-blueprint     public/blueprints/economics-blueprint
```

Or a git **sparse checkout** (no `degit`, keeps you off the rest of the repo):

```bash
git clone --no-checkout --depth 1 https://github.com/djamies1/djamies1.github.io.git
cd djamies1.github.io
git sparse-checkout init --cone
git sparse-checkout set rocket-blueprint satellite-blueprint gateway-blueprint terminal-blueprint spectrum-blueprint constellation-blueprint datapath-blueprint latency-blueprint deployment-blueprint comparison-blueprint economics-blueprint
git checkout main
# then copy the eleven folders wherever you host static assets
```

> Only take these eleven folders — **not** the whole repo (it also contains unrelated
> personal projects). Nothing needs building; these are final static files.

### (b) Fallback — one-file download (no git / npm needed)

If `degit` or `git` isn't available in the work environment, grab the pre-built bundle —
the same eleven folders in one spec-compliant zip (forward-slash paths, ~1.5 MB) — straight
from the repo over HTTPS, then unzip into your static dir:

```bash
curl -L -o blueprints-bundle.zip \
  https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/blueprints-handoff/blueprints-bundle.zip
unzip blueprints-bundle.zip -d public/blueprints/
# → public/blueprints/rocket-blueprint/ … spectrum-blueprint/
```

---

## [3] The embed contract  ← the important part

Every blueprint understands the same URL query params. There are two modes.

### Player mode — use this for embedding in app views

```
<folder>/index.html?mode=player&autoplay=1&loop=1
```

- **No page scrolling.** The timeline is time-driven; it plays itself and loops.
- Ships its own **transport UI**: Restart · Prev · REW · ▶/⏸ · FF · Next, an `N×` speed
  readout, and a **scrubbable `role="slider"` progress bar** (click / drag / arrow keys).
  These are the "play / fast-forward buttons."
- Works at **any size** — a sidebar card, a full-width hero, a modal.
- Put it in a **fixed-size** iframe (see aspect ratio below).

Params:

| param | meaning | default |
|-------|---------|---------|
| `mode` | `player` (fixed, time-driven) or `scroll` | `scroll` |
| `autoplay` | present ⇒ start playing immediately | off (paused poster) |
| `loop` | present ⇒ restart at the end | off |
| `speed` | timeScale multiplier; `1` ≈ 100 s end-to-end (`0.8` slower, `1.25` faster) | `1` |

### Scroll mode — only for a dedicated full-page view

```
<folder>/index.html          (no params)
```

Pinned scrollytelling: it pins and advances as the user scrolls **inside** the iframe. If
you use this, the iframe **must be viewport-height** (`height: 100vh`) — never auto-height.
For embedding inside existing views, prefer **player mode**; reserve scroll mode for a
standalone "deep dive" page, or just link out to the live URL.

### Sizing

The SVG `viewBox` is **1600 × 1000 = 8:5**. Give the iframe's container
`aspect-ratio: 8 / 5` (≈16:10) to avoid letterboxing. Very narrow/portrait viewports crop
the sheet gracefully instead of shrinking the type.

### Reduced motion & robustness

- `prefers-reduced-motion: reduce` (or missing GSAP) → the blueprint renders a **static,
  fully-labeled poster** automatically. No extra work on your side.
- Optional JS override instead of query params: each folder reads a `window.<PREFIX>_BP_CONFIG`
  object if present (`{ mode, autoplay, loop, speed }`). Prefix per folder:
  `ROCKET_BP_CONFIG`, `SAT_BP_CONFIG`, `GGT_BP_CONFIG`, `UT_BP_CONFIG`, `SPEC_BP_CONFIG`,
  `CON_BP_CONFIG`, `PATH_BP_CONFIG`, `LAT_BP_CONFIG`, `DEP_BP_CONFIG`, `CMP_BP_CONFIG`,
  `ECON_BP_CONFIG`.
  You almost certainly won't need this — query params are simpler.

---

## [4] Where the files go + CSP

Copy each folder intact under a single base path in your static/public assets:

```
public/blueprints/rocket-blueprint/
public/blueprints/satellite-blueprint/
public/blueprints/gateway-blueprint/
public/blueprints/terminal-blueprint/
public/blueprints/spectrum-blueprint/
public/blueprints/constellation-blueprint/
public/blueprints/datapath-blueprint/
public/blueprints/latency-blueprint/
public/blueprints/deployment-blueprint/
public/blueprints/comparison-blueprint/
public/blueprints/economics-blueprint/
```

The iframe `src` then becomes
`/blueprints/<name>-blueprint/index.html?mode=player&autoplay=1&loop=1`.

- **Copy each folder whole** — the relative `./js`, `./vendor`, `./fonts` refs mean it works
  under *any* base path, but only if the subfolders come along.
- **Same-origin is simplest.** If instead you host the folders on a different origin, the
  iframe still works, but your **CSP `frame-src`** must name that origin.
- **CSP:** because everything is same-origin and self-hosted with no external calls,
  `frame-src 'self'` is all the iframe needs. No CDN/font/script allowances required.
- **Next.js note:** files in `public/` are served verbatim, so the paths above "just work."
  Reference `index.html` explicitly in the `src` (don't rely on directory-index serving).

---

## [5] React integration

Mirror of the résumé site. Two patterns: a minimal single embed, and the tabbed showcase
(all eleven). Both are dependency-light (plain React) — add your design system on top.

### 5.1 Shared data + helper

```ts
// blueprints.ts
export type BlueprintProject = {
  id: string;
  label: string;
  path: string;        // hosted base path, trailing slash, e.g. "/blueprints/rocket-blueprint/"
  embedTitle: string;  // iframe title, for accessibility
  caption: string;
};

export const BLUEPRINTS: BlueprintProject[] = [
  { id: "rocket",    label: "Launch",    path: "/blueprints/rocket-blueprint/",
    embedTitle: "New Glenn launch vehicle — animated blueprint (auto-playing)",
    caption: "How New Glenn lifts a batch of Leo satellites to orbit." },
  { id: "satellite", label: "Satellite", path: "/blueprints/satellite-blueprint/",
    embedTitle: "Generic Amazon Leo satellite — animated blueprint (auto-playing)",
    caption: "Inside a Leo satellite, and how it talks to the ground." },
  { id: "gateway",   label: "Gateway",   path: "/blueprints/gateway-blueprint/",
    embedTitle: "Generic Amazon Leo ground gateway — animated blueprint (auto-playing)",
    caption: "The ground stations that link the constellation to the internet." },
  { id: "terminal",  label: "Terminal",  path: "/blueprints/terminal-blueprint/",
    embedTitle: "Generic Amazon Leo customer terminal — animated blueprint (auto-playing)",
    caption: "How a customer's terminal finds and locks onto a satellite pass." },
  { id: "spectrum",  label: "Spectrum",  path: "/blueprints/spectrum-blueprint/",
    embedTitle: "How Amazon Leo uses radio spectrum — animated blueprint (auto-playing)",
    caption: "The invisible layer: the radio bands Leo runs on, and how they're licensed." },
  { id: "constellation", label: "Constellation", path: "/blueprints/constellation-blueprint/",
    embedTitle: "How the Amazon Leo constellation forms one network — animated blueprint (auto-playing)",
    caption: "Three shells, 98 planes, and a laser mesh — the whole network in orbit." },
  { id: "datapath", label: "Data path", path: "/blueprints/datapath-blueprint/",
    embedTitle: "How data travels end-to-end on Amazon Leo — animated blueprint (auto-playing)",
    caption: "One packet's round trip: terminal → satellite → laser mesh → gateway → AWS." },
  { id: "latency", label: "Why LEO", path: "/blueprints/latency-blueprint/",
    embedTitle: "Why low Earth orbit lowers latency and needs a constellation — animated blueprint (auto-playing)",
    caption: "Why it all flies low: altitude sets latency, and the trade-offs that follow." },
  { id: "deployment", label: "Deployment", path: "/blueprints/deployment-blueprint/",
    embedTitle: "How Amazon Leo gets deployed against the FCC clock — animated blueprint (auto-playing)",
    caption: "Building 3,236 satellites against a use-it-or-lose-it FCC deadline." },
  { id: "comparison", label: "vs Starlink", path: "/blueprints/comparison-blueprint/",
    embedTitle: "Amazon Leo vs Starlink — a public architecture comparison, animated blueprint (auto-playing)",
    caption: "Two bets on the same idea: Amazon Leo and Starlink, side by side." },
  { id: "economics", label: "Economics", path: "/blueprints/economics-blueprint/",
    embedTitle: "The rough public economics of a LEO network — animated blueprint (auto-playing)",
    caption: "The shape of the bet: heavy capex now, recurring revenue later. Public estimates only." },
];

// player-mode URL for a given folder
export const playerSrc = (path: string) =>
  `${path}index.html?mode=player&autoplay=1&loop=1`;
```

### 5.2 A tiny lazy-mount hook (no dependency)

An iframe per blueprint is real work; don't mount them until they're near the viewport.

```tsx
import { useEffect, useRef, useState, type RefObject } from "react";

export function useInView(ref: RefObject<Element | null>, rootMargin = "400px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, inView]);
  return inView;
}
```

### 5.3 Pattern A — single embed (drop into any existing view)

```tsx
import { useRef, useState } from "react";
import { playerSrc } from "./blueprints";
import { useInView } from "./use-in-view";

export function BlueprintEmbed({ path, title }: { path: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative", width: "100%", aspectRatio: "8 / 5",
        overflow: "hidden", borderRadius: 16, background: "#0b2749",
      }}
    >
      {inView && (
        <iframe
          src={playerSrc(path)}
          title={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%", height: "100%", border: 0,
            opacity: loaded ? 1 : 0, transition: "opacity .4s ease",
          }}
        />
      )}
    </div>
  );
}
```

```tsx
// usage
<BlueprintEmbed
  path="/blueprints/spectrum-blueprint/"
  title="How Amazon Leo uses radio spectrum — animated blueprint"
/>
```

### 5.4 Pattern B — tabbed showcase (all eleven, like the résumé)

```tsx
import { useId, useRef, useState } from "react";
import { BLUEPRINTS, playerSrc, type BlueprintProject } from "./blueprints";
import { useInView } from "./use-in-view";

export function BlueprintShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const [activeId, setActiveId] = useState(BLUEPRINTS[0].id);
  const active = BLUEPRINTS.find((b) => b.id === activeId) ?? BLUEPRINTS[0];
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  return (
    <div ref={rootRef} className="bp-showcase">
      <div role="tablist" aria-label="Blueprint project" className="bp-tabs">
        {BLUEPRINTS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={tabId(p.id)}
            aria-selected={p.id === activeId}
            aria-controls={panelId}
            className={p.id === activeId ? "bp-tab is-active" : "bp-tab"}
            onClick={() => setActiveId(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(active.id)}
        className="bp-panel"                /* give this aspect-ratio: 8/5 in CSS */
      >
        {/* key={active.id}: switching tabs REMOUNTS, so the player restarts clean.
            Exactly one iframe is ever mounted. */}
        {inView && <BlueprintFrame key={active.id} project={active} />}
      </div>

      <div className="bp-caption-row">
        <p className="bp-caption">{active.caption}</p>
        <a href={`${active.path}index.html`} target="_blank" rel="noopener">
          Open the full walkthrough ↗
        </a>
      </div>
    </div>
  );
}

function BlueprintFrame({ project }: { project: BlueprintProject }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="bp-frame" style={{ position: "relative", width: "100%", height: "100%" }}>
      <iframe
        src={playerSrc(project.path)}
        title={project.embedTitle}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ width: "100%", height: "100%", border: 0, opacity: loaded ? 1 : 0, transition: "opacity .4s" }}
      />
      {!loaded && (
        <div className="bp-frame-loading" aria-hidden style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          Loading blueprint…
        </div>
      )}
    </div>
  );
}
```

Minimal CSS to make it functional (style to taste):

```css
.bp-tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.bp-tab { padding: 6px 12px; border-radius: 999px; font-size: 13px; }
.bp-tab.is-active { background: #f0b429; color: #0b1520; }   /* the résumé slides a pill here */
.bp-panel { aspect-ratio: 8 / 5; width: 100%; overflow: hidden; border-radius: 16px; }
.bp-caption-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 12px; }
```

**Behaviors to preserve (each matters):**

- **Lazy mount** (`useInView`) — don't mount eleven heavy iframes on page load.
- **One iframe at a time** — render only the active tab's frame.
- **Keyed remount** (`key={active.id}`) — switching tabs restarts the player cleanly.
- `loading="lazy"`, a real `title`, and `rel="noopener"` on the link-out.
- The "Open the full walkthrough" link goes to **scroll mode** (no `?mode=player`) so it
  opens the full scrollytelling page in a new tab.

The exact résumé component (with `framer-motion` sliding pill + `lucide-react` icons +
Tailwind) is in **Appendix A** if the app already has those libraries.

---

## [6] Compliance — do not skip

These blueprints are cleared to sit inside an internal app **specifically because** they
are built **only from public sources** (FCC authorizations, ITU/WRC rules, published specs,
trade press), are **representative/schematic** (labeled NTS — not to scale), and are
**not derived from any internal or export-controlled (ITAR / EAR) data**.

Every sheet carries that framing on-canvas: a persistent **chip** (e.g. `PUBLIC SOURCES ·
FCC / ITU · NTS`), title-block **general notes**, a `PROVENANCE` citation string, and a
`PUBLIC DATA ONLY` finale **stamp**.

**Rules:**
- **Keep all of that chrome visible.** Don't crop, cover, or CSS-hide the chip, notes,
  stamp, or provenance. Don't zoom/clip the iframe so they fall outside the frame.
- **Don't add real internal data.** No real coordinates, part numbers, link budgets,
  fleet counts, roadmap dates, or customer info onto these sheets. If a stakeholder wants
  real internal figures, that is a *separate, differently-classified* asset — not these.
- Treat the folders as **read-only**. If a genuine change is needed, take it back to the
  source project (`djamies1/djamies1.github.io`); don't fork the sheet inside the app.

---

## [7] Verification checklist

After wiring each embed:

- [ ] iframe loads; it **auto-plays** and **loops**.
- [ ] Transport works: ▶/⏸ toggles; **FF/REW** change the `N×` label and the visible
      speed; **Prev/Next** jump whole scenes; the **progress bar** scrubs by click, drag,
      and arrow keys.
- [ ] Container is **8:5**; no letterboxing; no horizontal scrollbar.
- [ ] All **eleven** embeds load and switch correctly (tabbed showcase: exactly one iframe
      in the DOM at a time; switching tabs restarts the player).
- [ ] **DevTools → Network, filtered to the iframe: zero external/third-party requests**
      (everything is same-origin under `/blueprints/…`). This is the CSP-safety check.
- [ ] `prefers-reduced-motion: reduce` → a static labeled poster renders (no errors).
- [ ] Compliance chrome (chip / notes / stamp / provenance) is visible on each sheet.
- [ ] No console errors.

Fast local sanity check before integrating, from wherever you unpacked the folders:

```bash
# serve the parent of the blueprint folders
python -m http.server 8123
# open: http://localhost:8123/blueprints/spectrum-blueprint/index.html?mode=player&autoplay=1&loop=1
```

---

## [8] Gotchas

- **Use `mode=player` for embedded views.** The default (`scroll`) needs a full
  viewport-height iframe and won't behave in a fixed card.
- **Copy each folder whole.** Relative asset paths mean the folder is portable, but only
  with its `js/ vendor/ fonts/` subfolders intact.
- **Don't mount all eleven at once** — lazy-mount, one iframe at a time. Eleven simultaneous
  GSAP timelines is wasteful.
- **Keyed remount on tab switch**, or the player won't reset to the start of the new sheet.
- **Reference `index.html` explicitly** in `src` rather than relying on directory-index
  serving (varies by host/CDN).
- **Aspect ratio 8:5.** Anything else letterboxes or crops.
- Each blueprint's own `HANDOFF.md` (inside its folder) documents that sheet's internals if
  you ever need to go deeper.

---

## Appendix A — the exact résumé component (reference)

This is what's running on the personal site (`resume-app/src/components/mission/`). It
depends on **`framer-motion`** (the sliding tab pill, caption cross-fade), **`lucide-react`**
(per-tab icons), and Tailwind utility classes. Use it if the app already has those; the
dependency-light §5.4 above does the same job without them.

`blueprint-icons.tsx`:

```tsx
import { AudioLines, CalendarClock, CircleDollarSign, Gauge, GitCompare,
         MonitorSmartphone, Orbit, RadioTower, Rocket, Satellite, Waypoints,
         type LucideIcon } from "lucide-react";

const BLUEPRINT_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, satellite: Satellite, gateway: RadioTower,
  terminal: MonitorSmartphone, spectrum: AudioLines,
  constellation: Orbit, datapath: Waypoints, deployment: CalendarClock,
  latency: Gauge, comparison: GitCompare, economics: CircleDollarSign,
};

export function BlueprintIcon({ id, className }: { id: string; className?: string }) {
  const Icon = BLUEPRINT_ICONS[id];
  return Icon ? <Icon aria-hidden className={className} /> : null;
}
```

`BlueprintShowcase.tsx` (structure — Tailwind classes trimmed for brevity; the load-bearing
bits are the ARIA tablist, `key={active.id}` remount, lazy mount via `useInView`, and the
`?mode=player&autoplay=1&loop=1` src):

```tsx
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { BLUEPRINTS } from "@/data/blueprints";
import { BlueprintIcon } from "./blueprint-icons";

export function BlueprintShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, "400px");
  const [activeId, setActiveId] = useState(BLUEPRINTS[0].id);
  const active = BLUEPRINTS.find((b) => b.id === activeId) ?? BLUEPRINTS[0];
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (id: string) => `${uid}-tab-${id}`;

  return (
    <div className="mt-16">
      <p className="eyebrow mb-5">The blueprints</p>
      <p>Eleven interactive blueprints I designed and built to explain the machine behind the numbers.</p>

      <div role="tablist" aria-label="Blueprint project" className="inline-flex flex-wrap gap-1 rounded-full p-1.5">
        {BLUEPRINTS.map((project) => {
          const isActive = project.id === activeId;
          return (
            <button key={project.id} type="button" role="tab"
              id={tabId(project.id)} aria-selected={isActive} aria-controls={panelId}
              onClick={() => setActiveId(project.id)}
              className={isActive ? "relative … text-ink" : "relative … text-muted-foreground"}>
              {isActive && (
                <motion.span className="absolute inset-0 rounded-full bg-gold"
                  layoutId="blueprint-tab-pill"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }} />
              )}
              <BlueprintIcon className="relative z-10 h-3.5 w-3.5" id={project.id} />
              <span className="relative z-10">{project.label}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(active.id)}
           className="mt-4 aspect-[8/5] w-full overflow-hidden rounded-2xl">
        {inView ? <BlueprintFrame key={active.id} project={active} /> : <Skeleton />}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p key={active.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {active.caption}
          </motion.p>
        </AnimatePresence>
        <a href={active.path} target="_blank" rel="noopener">
          Open the full walkthrough <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function BlueprintFrame({ project }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full w-full">
      <iframe className="h-full w-full border-0" loading="lazy"
        onLoad={() => setLoaded(true)}
        src={`${project.path}?mode=player&autoplay=1&loop=1`}
        title={project.embedTitle} />
      {/* loading overlay fades out on load */}
    </div>
  );
}
```

> Note: on the résumé, folders sit at the site **root** (`/rocket-blueprint/`), so `path`
> is `/rocket-blueprint/` and the src is `` `${project.path}?mode=player…` `` (directory +
> query). In the app you're hosting them under `/blueprints/…`, so use the `playerSrc()`
> helper from §5.1, which appends `index.html` explicitly.

---

## Appendix B — quick reference

- **Source repo:** https://github.com/djamies1/djamies1.github.io (public, branch `main`)
- **Player src:** `<folder>/index.html?mode=player&autoplay=1&loop=1`
- **Scroll src:** `<folder>/index.html` (viewport-height iframe only)
- **Aspect ratio:** 8 : 5
- **Config globals:** `ROCKET_BP_CONFIG`, `SAT_BP_CONFIG`, `GGT_BP_CONFIG`, `UT_BP_CONFIG`,
  `SPEC_BP_CONFIG`, `CON_BP_CONFIG`, `PATH_BP_CONFIG`, `LAT_BP_CONFIG`, `DEP_BP_CONFIG`,
  `CMP_BP_CONFIG`, `ECON_BP_CONFIG`
- **Runtime deps:** none external — GSAP + fonts are vendored inside each folder.
