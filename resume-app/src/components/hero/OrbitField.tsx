import { animate, createScope, type Scope, stagger, svg } from "animejs";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

interface Orbit {
  rx: number;
  ry: number;
  rotate: number;
  opacity: number;
  width: number;
  /** Seconds for one satellite revolution. */
  period: number;
}

/* Ellipses share a focus offset right-of-centre, like a constellation ground track plot. */
const ORBITS: Orbit[] = [
  { rx: 520, ry: 190, rotate: -16, opacity: 0.5, width: 1.4, period: 36 },
  { rx: 420, ry: 260, rotate: -38, opacity: 0.35, width: 1.1, period: 48 },
  { rx: 330, ry: 130, rotate: 8, opacity: 0.45, width: 1.2, period: 28 },
  { rx: 600, ry: 300, rotate: -27, opacity: 0.2, width: 0.9, period: 64 },
];

const CX = 940;
const CY = 360;

/** Ellipse as a path (two arcs) so anime's createDrawable can line-draw it. */
function ellipsePath({ rx, ry }: Orbit): string {
  return `M ${-rx} 0 A ${rx} ${ry} 0 1 0 ${rx} 0 A ${rx} ${ry} 0 1 0 ${-rx} 0 Z`;
}

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  dur: number;
}

/** Deterministic pseudo-random stars — stable across renders. */
function makeStars(count: number): Star[] {
  const stars: Star[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 1440,
      y: rand() * 820,
      r: 0.6 + rand() * 1.1,
      delay: rand() * 6,
      dur: 2.5 + rand() * 4,
    });
  }
  return stars;
}

/**
 * Hero backdrop: starfield + gold orbit arcs line-drawn on load, with
 * satellite dots riding each orbit on an anime.js motion path.
 */
export function OrbitField() {
  const rootRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const stars = useMemo(() => makeStars(70), []);

  useEffect(() => {
    if (!rootRef.current || reducedMotion) return;
    let scope: Scope | undefined;
    // createScope wants an HTMLElement-ish root; the SVG's parent div works.
    const rootEl = rootRef.current.parentElement;
    if (!rootEl) return;

    scope = createScope({ root: rootEl }).add(() => {
      animate(svg.createDrawable(".orbit-path"), {
        draw: ["0 0", "0 1"],
        duration: 2200,
        delay: stagger(240, { start: 300 }),
        ease: "inOutQuad",
      });

      for (const [i, orbit] of ORBITS.entries()) {
        const path = rootEl.querySelector<SVGPathElement>(`#orbit-p-${i}`);
        const dot = rootEl.querySelector<SVGGElement>(`#orbit-sat-${i}`);
        if (!path || !dot) continue;
        const { translateX, translateY } = svg.createMotionPath(path);
        animate(dot, {
          translateX,
          translateY,
          duration: orbit.period * 1000,
          ease: "linear",
          loop: true,
        });
        animate(dot, {
          opacity: [0, 1],
          duration: 800,
          delay: 1200 + i * 240,
          ease: "outQuad",
        });
      }
    });

    return () => scope?.revert();
  }, [reducedMotion]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <svg
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        ref={rootRef}
        viewBox="0 0 1440 820"
      >
        <defs>
          <radialGradient id="hero-glow" cx="0.65" cy="0.42" r="0.6">
            <stop offset="0%" stopColor="rgba(201,168,76,0.10)" />
            <stop offset="55%" stopColor="rgba(201,168,76,0.03)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0)" />
          </radialGradient>
          <filter id="sat-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" />
          </filter>
        </defs>

        <rect fill="url(#hero-glow)" height="820" width="1440" />

        {stars.map((s, i) => (
          <circle
            className="star-twinkle"
            cx={s.x}
            cy={s.y}
            fill="#f5f0e8"
            key={i}
            r={s.r}
            style={{
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}

        {ORBITS.map((o, i) => (
          <g key={i} transform={`translate(${CX} ${CY}) rotate(${o.rotate})`}>
            <path
              className="orbit-path"
              d={ellipsePath(o)}
              fill="none"
              id={`orbit-p-${i}`}
              stroke="#c9a84c"
              strokeOpacity={o.opacity}
              strokeWidth={o.width}
            />
            <g id={`orbit-sat-${i}`} opacity={reducedMotion ? 1 : 0}>
              <circle fill="#e8d5a3" filter="url(#sat-glow)" r="4.5" />
              <circle fill="#e8d5a3" r="2" />
            </g>
          </g>
        ))}
      </svg>

      {/* fade to page ink at the base so hero content stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
    </div>
  );
}
