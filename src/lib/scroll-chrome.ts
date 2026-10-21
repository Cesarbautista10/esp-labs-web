// Page chrome that reacts to scrolling (the lesson dock): "compact" once you have left the top, and
// "hidden" while you scroll down, back as soon as you scroll up. The decision is a pure function,
// so it is tested without a browser; useScrollChrome feeds it the scroll position.

export interface ScrollChrome {
  /** Past the top of the page: show the small form. */
  compact: boolean;
  /** Scrolling down: get out of the way. */
  hidden: boolean;
}

export interface ScrollChromeConfig {
  /** Scroll position (px) after which the chrome turns compact. */
  compactAfter: number;
  /** Scroll position (px) after which scrolling down may hide it. */
  hideAfter: number;
  /** How far (px) you must travel one way before it reacts: ignores jitter and trackpad bounce. */
  travel: number;
}

/** What the chrome remembers between scroll events. */
export interface ScrollMemory extends ScrollChrome {
  y: number;
  /** Where the current run in one direction began. */
  turn: number;
  down: boolean;
}

export const INITIAL_SCROLL: ScrollMemory = {
  compact: false,
  hidden: false,
  y: 0,
  turn: 0,
  down: true,
};

export function nextScrollChrome(
  prev: ScrollMemory,
  y: number,
  { compactAfter, hideAfter, travel }: ScrollChromeConfig,
): ScrollMemory {
  const next = { ...prev, y, compact: y > compactAfter };
  if (y > prev.y) {
    if (!prev.down) next.turn = prev.y;
    next.down = true;
    if (y > hideAfter && y - next.turn > travel) next.hidden = true;
  } else if (y < prev.y) {
    if (prev.down) next.turn = prev.y;
    next.down = false;
    if (next.turn - y > travel) next.hidden = false;
  }
  if (y <= compactAfter) next.hidden = false;
  return next;
}
