"use client";

import { useLayoutEffect, useRef, useState } from "react";

// One-time scroll-reveal wrapper: fades/slides a section in the first time
// it enters the viewport, then leaves it alone — not a repeating effect, so
// scrolling back up and down doesn't re-trigger it. `prefers-reduced-motion`
// is handled purely in CSS (see .reveal in globals.css).
//
// Content already inside the viewport at mount (e.g. a card grid near the
// top of a page) skips the animation entirely rather than fading in on
// load. This isn't just a nicety: Next.js server-renders the hidden state
// into the initial HTML, and the browser paints that raw HTML before any
// JS runs — a real, distinct paint no client-side timing trick can erase
// after the fact. If the CSS transition were always active, hydration would
// animate FROM that already-painted opacity:0 frame no matter how quickly
// it ran, and axe-core correctly caught the result: still-fading,
// sub-4.5:1-contrast text on a page whose content sat above the fold. So
// the `.reveal-animate` class (which is what actually enables the
// transition) is only ever added for elements confirmed, via
// getBoundingClientRect() before first paint, to be off-screen at mount —
// i.e. only for a genuine future scroll-triggered reveal.
export default function Reveal({
  children,
  delayMs = 0,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  as?: "div" | "section" | "li";
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true); // already on-screen — show instantly, no transition class
      return;
    }

    setAnimate(true); // off-screen for now — this instance gets a real transition later
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = Tag as "div";
  return (
    <Comp
      ref={ref}
      className={`reveal ${animate ? "reveal-animate" : ""} ${visible ? "is-visible" : ""} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      {...rest}
    >
      {children}
    </Comp>
  );
}
