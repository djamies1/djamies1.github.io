import {
  Award,
  Mail,
  Radar,
  Rocket,
  Satellite,
  SquareTerminal,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "deck", label: "Deck", icon: SquareTerminal },
  { id: "flight-log", label: "Flight Log", icon: Rocket },
  { id: "mission", label: "Mission", icon: Satellite },
  { id: "capabilities", label: "Capabilities", icon: Radar },
  { id: "credentials", label: "Credentials", icon: Award },
  { id: "contact", label: "Contact", icon: Mail },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Floating HUD dock (desktop only) — glass pill of section jump links with a
 * gold active indicator that tracks the section currently in view.
 */
export function HudNav() {
  const [active, setActive] = useState<SectionId>("deck");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionId);
          }
        }
      },
      // A narrow band around the viewport centre decides the active section.
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="-translate-x-1/2 fixed bottom-6 left-1/2 z-50 hidden md:block"
    >
      <div className="glass flex items-center gap-1 rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <a
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-200",
                isActive
                  ? "text-ink"
                  : "text-muted-foreground hover:text-cream"
              )}
              href={`#${id}`}
              key={id}
            >
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-gold"
                  layoutId="hud-active-pill"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <Icon aria-hidden className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 font-medium">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
