import { type LessonEntry, resolveLesson, stepKey } from "./lesson";

/** Ticked steps, keyed by stepKey(). */
export type Ticks = Readonly<Record<string, boolean>>;

/** Done = every step ticked (in at least one variant, for lessons that have several). */
export function isLessonDone(lesson: LessonEntry, ticks: Ticks): boolean {
  if (lesson.kind !== "lesson") return false;
  const keys = lesson.variants?.map((v) => v.key) ?? [undefined];
  return keys.some((key) => {
    const resolved = resolveLesson(lesson, key);
    return resolved.steps.length > 0 && resolved.steps.every((_, i) => ticks[stepKey(resolved, i)]);
  });
}

const WORKING_STATUS = /works|runs|on board/;

/** Working = done by you, or already confirmed on the real board. */
export function isLessonWorking(lesson: LessonEntry, ticks: Ticks): boolean {
  return (
    lesson.kind === "lesson" && (isLessonDone(lesson, ticks) || WORKING_STATUS.test(lesson.status))
  );
}

/** Where a track button takes you: the first lesson that isn't working yet, else the first. */
export function entryLesson(
  lessons: readonly LessonEntry[],
  ticks: Ticks,
): LessonEntry | undefined {
  const open = lessons.filter((l) => l.kind === "lesson");
  return open.find((l) => !isLessonWorking(l, ticks)) ?? open[0];
}
