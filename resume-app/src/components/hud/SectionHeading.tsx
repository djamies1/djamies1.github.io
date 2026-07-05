import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Small-caps gold telemetry label, e.g. "02 · FLIGHT LOG". */
  eyebrow: string;
  /** Playfair display title. */
  title: ReactNode;
  /** Optional supporting line under the title. */
  lede?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <header className={cn("mb-10 max-w-3xl md:mb-14", className)}>
      <p className="eyebrow mb-3 flex items-center gap-3">
        <span aria-hidden className="h-px w-8 bg-gold/60" />
        {eyebrow}
      </p>
      <h2
        className="font-display text-4xl text-cream leading-[1.05] tracking-tight md:text-5xl"
        id={id}
      >
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
          {lede}
        </p>
      ) : null}
    </header>
  );
}
