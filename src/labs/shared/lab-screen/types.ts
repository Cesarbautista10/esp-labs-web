import type { ResolvedLesson } from "@/domain/lesson";
import type { ScopePalette } from "@/lib/canvas";
import type { TerminalPrinter, Tone } from "@/ui/terminal/terminal-log";

/** Every lab screen state knows which view the push button has selected. */
export interface LabState {
  view: number;
}

/** A button under the simulated screen: stands in for hands, a phone or the push button. */
export interface LabAction<S> {
  /** Fixed text, or text derived from the state (recomputed after every action). */
  readonly label: string | ((state: S) => string);
  /** For toggles: shown pressed when true. */
  readonly pressed?: (state: S) => boolean;
  run(state: S, term: TerminalPrinter): void;
}

/**
 * One lab's firmware screen: its views, how it draws them (a port of the board's own drawing
 * code onto a 320×170 canvas) and how the pretend board answers buttons and serial commands.
 * Pure TypeScript, no React: it can be unit-tested with a fake canvas.
 */
export interface ScreenSpec<S extends LabState> {
  readonly views: readonly string[];
  /** One sentence per view for the "What the screen shows" panel. */
  readonly captions?: readonly string[];
  init(): S;
  /** Draws the view area (y 29..158); the kit draws the status bar and footer. */
  draw(g: CanvasRenderingContext2D, C: ScopePalette, view: number, t: number, state: S): void;
  /** Advances lab-specific state every frame. */
  tick?(state: S, dt: number, view: number): void;
  readonly actions?: readonly LabAction<S>[];
  /** Serial lines printed after the kit's own boot lines. */
  readonly boot?: readonly string[];
  /** Lab commands. Return false when the line is not one of them. */
  onCommand?(line: string, state: S, term: TerminalPrinter): boolean | void;
}

/**
 * What every lab of a track shares (a Strategy): the status bar, the shared hardware model,
 * common buttons and commands. LabScreen and ScreenGallery work with any kit.
 */
export interface LabKit<S extends LabState, Spec extends ScreenSpec<S> = ScreenSpec<S>> {
  /** Firmware prefix in messages, e.g. "ble-lab" → "ble-lab-b3". */
  readonly firmware: string;
  /** Caption under the preview. */
  readonly previewCaption: string;
  /** Draws the status bar and footer over the view, every frame. */
  chrome(
    g: CanvasRenderingContext2D,
    C: ScopePalette,
    lesson: ResolvedLesson,
    spec: Spec,
    view: number,
    state: S,
    t: number,
  ): void;
  /** Advances the track's shared hardware model every frame, before tick and draw. */
  step?(state: S, dt: number): void;
  /** Buttons shown right after "next view" (and in the gallery): hands, voice... */
  readonly handActions?: readonly LabAction<S>[];
  /** Buttons after the lab's own. */
  trailingActions?(lesson: ResolvedLesson, spec: Spec): readonly LabAction<S>[];
  /** Serial lines printed first at start-up. */
  bootLines?(state: S): readonly (readonly [string, Tone])[];
  /** Runs once the boot lines are out (help text, a start-up chime...). */
  afterBoot?(state: S, term: TerminalPrinter, lesson: ResolvedLesson, spec: Spec): void;
  /** Commands every lab of the track understands. Return true when handled. */
  shell?(
    line: string,
    state: S,
    term: TerminalPrinter,
    lesson: ResolvedLesson,
    spec: Spec,
  ): boolean;
  /** A tap on the screen or Space while it has focus (e.g. a clap). */
  onTap?(state: S): void;
  readonly tapHint?: string;
  /**
   * Outside state the buttons show (e.g. a page-wide sound switch): call `changed` when it
   * changes so labels and pressed states re-render. Returns an unsubscribe function.
   */
  subscribe?(changed: () => void): () => void;
  /** Start/stop side resources (timers, audio) for one mounted preview. */
  start?(state: S, term: TerminalPrinter): (() => void) | void;
}
