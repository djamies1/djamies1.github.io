import { useEffect, useRef } from "react";

/** Thin gold progress bar fixed to the top edge, driven by page scroll. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const frac = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${frac})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-gold to-gold-light"
      ref={barRef}
      style={{ transform: "scaleX(0)" }}
    />
  );
}
