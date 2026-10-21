import type { LessonState } from "@/domain/progress";

/** What each lesson state is called on screen. The glyph shape carries it too, not only colour. */
export const STATE_INFO: Record<LessonState, { label: string; hint: string }> = {
  done: { label: "done by you", hint: "every step ticked" },
  works: { label: "runs on the board", hint: "confirmed on the real board" },
  built: { label: "built, not flashed", hint: "the firmware compiles; try it on your board" },
  planned: { label: "planned", hint: "on the roadmap, not written yet" },
};

export const STATE_ORDER: readonly LessonState[] = ["done", "works", "built", "planned"];
