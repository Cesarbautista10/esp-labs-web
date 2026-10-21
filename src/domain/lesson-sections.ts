import type { ResolvedLesson } from "./lesson";

/** The parts of a lesson page, in reading order. Each has its own icon and colour cue. */
export type SectionKind = "goal" | "explain" | "wiring" | "commands" | "steps" | "preview";

export interface LessonSection {
  /** DOM id of the section, also its key in the section nav. */
  readonly id: string;
  readonly kind: SectionKind;
  /** Full heading shown on the page. */
  readonly title: string;
  /** One or two words for the section nav. */
  readonly short: string;
  /** Index into `lesson.panels` for explainer sections. */
  readonly panel?: number;
}

/**
 * The sections a lesson shows, built from what it actually has: a lesson without wiring has no
 * "Wire" step. The page and its section nav both read this list, so they never disagree.
 */
export function lessonSections(lesson: ResolvedLesson): LessonSection[] {
  const sections: LessonSection[] = [
    { id: "sec-goal", kind: "goal", title: "Goal", short: "Goal" },
  ];
  lesson.panels.forEach((panel, i) =>
    sections.push({
      id: `sec-explain-${i}`,
      kind: "explain",
      title: panel.title,
      short: lesson.panels.length > 1 ? `How ${i + 1}` : "How it works",
      panel: i,
    }),
  );
  if (lesson.wiring)
    sections.push({
      id: "sec-wiring",
      kind: "wiring",
      title: lesson.wiring.title ?? "Wiring",
      short: "Wire",
    });
  if (lesson.commands?.length)
    sections.push({
      id: "sec-commands",
      kind: "commands",
      title: "Commands, in order",
      short: "Commands",
    });
  sections.push({ id: "sec-steps", kind: "steps", title: "Steps", short: "Steps" });
  if (lesson.preview)
    sections.push({
      id: "sec-preview",
      kind: "preview",
      title: "Preview: what you should see",
      short: "Preview",
    });
  return sections;
}
