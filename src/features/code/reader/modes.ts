import type { ComponentType } from "react";
import { ExploreMode } from "./modes/ExploreMode";
import { StoryMode } from "./modes/StoryMode";
import { TourMode } from "./modes/TourMode";
import type { ModeId } from "./reader-context";

// The ways to read a lab's code. Adding one = a component that renders a ReaderFrame, plus an
// entry here; the shell, toolbar and URL handling pick it up.
export interface ReaderModeInfo {
  readonly id: ModeId;
  readonly label: string;
  /** One line under the label in the mode switch's tooltip. */
  readonly hint: string;
  /** Offered in the Simple view too. */
  readonly simple: boolean;
  readonly Component: ComponentType;
}

export const READER_MODES: readonly ReaderModeInfo[] = [
  {
    id: "tour",
    label: "Tour",
    hint: "File by file, a few lines at a time",
    simple: true,
    Component: TourMode,
  },
  {
    id: "story",
    label: "Story",
    hint: "Follow the program as it runs, across files",
    simple: true,
    Component: StoryMode,
  },
  {
    id: "explore",
    label: "Explore",
    hint: "Tap any line or word",
    simple: false,
    Component: ExploreMode,
  },
];

export const modesFor = (simple: boolean) => READER_MODES.filter((m) => !simple || m.simple);
