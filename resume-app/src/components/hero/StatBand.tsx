import { animate, utils } from "animejs";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { HERO_STATS } from "@/data/resume";

/**
 * Identity stat tiles along the hero's lower edge — who he is, not vanity
 * metrics. Values count up with anime.js once the hero has settled.
 */
export function StatBand() {
  const rootRef = useRef<HTMLDListElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-count]");
    if (reducedMotion) {
      for (const el of nodes) {
        el.textContent = el.dataset.count ?? "";
      }
      return;
    }
    const animations = Array.from(nodes, (el, i) => {
      const target = Number(el.dataset.count);
      const proxy = { n: 0 };
      return animate(proxy, {
        n: target,
        duration: 1600,
        delay: 900 + i * 140,
        ease: "outExpo",
        modifier: utils.round(0),
        onUpdate: () => {
          el.textContent = String(proxy.n);
        },
      });
    });
    return () => {
      for (const a of animations) a.cancel();
    };
  }, [reducedMotion]);

  return (
    <dl
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      ref={rootRef}
    >
      {HERO_STATS.map((stat) => (
        <div
          className="glass rounded-xl px-5 py-4 text-left"
          key={stat.label}
        >
          <dd className="font-display text-3xl text-gold-light md:text-4xl">
            <span data-count={stat.value}>0</span>
            {stat.suffix ?? ""}
          </dd>
          <dt className="mt-1 text-[0.7rem] text-muted-foreground uppercase tracking-[0.18em]">
            {stat.label}
          </dt>
          {stat.note ? (
            <p className="mt-1.5 text-[0.7rem] text-gold/70">{stat.note}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
