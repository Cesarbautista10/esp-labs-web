import { useEffect, useState } from "react";
import {
  INITIAL_SCROLL,
  nextScrollChrome,
  type ScrollChrome,
  type ScrollChromeConfig,
  type ScrollMemory,
} from "./scroll-chrome";

const FULL: ScrollChrome = { compact: false, hidden: false };

/**
 * Follows the page scroll (one passive listener, at most once per frame) and re-renders only when
 * the chrome's form changes, not on every scroll event. See scroll-chrome.ts for the rules.
 */
export function useScrollChrome(config: ScrollChromeConfig): ScrollChrome {
  const [chrome, setChrome] = useState<ScrollChrome>(FULL);
  const { compactAfter, hideAfter, travel } = config;

  useEffect(() => {
    const cfg = { compactAfter, hideAfter, travel };
    let memory: ScrollMemory = INITIAL_SCROLL;
    let frame = 0;

    const read = () => {
      frame = 0;
      // Elastic overscroll (iOS, trackpads) reports positions outside the page: clamp them.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY, 0), Math.max(max, 0));
      memory = nextScrollChrome(memory, y, cfg);
      const { compact, hidden } = memory;
      setChrome((c) => (c.compact === compact && c.hidden === hidden ? c : { compact, hidden }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    frame = requestAnimationFrame(read);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [compactAfter, hideAfter, travel]);

  return chrome;
}
