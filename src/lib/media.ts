import { useSyncExternalStore } from "react";

// One subscribe function per query, so useSyncExternalStore never resubscribes on re-render.
const subscribers = new Map<string, (listener: () => void) => () => void>();

function subscribeTo(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = (listener) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    };
    subscribers.set(query, subscribe);
  }
  return subscribe;
}

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => matchMedia(query).matches,
    () => false,
  );
}

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** For code outside render (animation loops, event handlers). */
export const prefersReducedMotion = () => matchMedia(REDUCED_MOTION).matches;

export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION);
