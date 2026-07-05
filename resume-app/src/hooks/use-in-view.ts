import { type RefObject, useEffect, useState } from "react";

/**
 * True once the element has approached the viewport. Latches on — used to
 * mount heavy lazy content (the WebGL globe) slightly before it's visible.
 */
export function useInView(
  ref: RefObject<Element | null>,
  rootMargin = "600px"
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, inView]);

  return inView;
}
