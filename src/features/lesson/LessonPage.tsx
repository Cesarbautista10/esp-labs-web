import type { ResolvedLesson } from "@/domain/lesson";
import { BoardCard } from "@/features/board/BoardCard";
import { Panel } from "@/ui/Panel";
import { CommandsPanel } from "./CommandsPanel";
import { LessonHeader } from "./LessonHeader";
import styles from "./LessonPage.module.css";
import { StepsChecklist } from "./StepsChecklist";
import { WidgetSlot } from "./WidgetSlot";
import { WiringTable } from "./WiringTable";

/**
 * One lesson, top to bottom: what and why, the explainers, the wiring, the commands, the
 * steps, and a preview of what the board should do. The pinout sits beside it.
 */
export function LessonPage({
  lesson,
  onVariant,
}: {
  lesson: ResolvedLesson;
  onVariant: (key: string) => void;
}) {
  return (
    <div className={styles.grid}>
      <BoardCard lesson={lesson} />
      <article className={styles.lesson} aria-labelledby={`lesson-${lesson.id}-title`}>
        <LessonHeader lesson={lesson} onVariant={onVariant} />
        {lesson.panels.map((panel, i) => (
          <Panel key={`${panel.widget}-${i}`} title={panel.title} intro={panel.intro}>
            <WidgetSlot
              widget={panel.widget}
              lesson={lesson}
              panel={panel}
              name={`${lesson.id} · ${panel.title}`}
            />
          </Panel>
        ))}
        {lesson.wiring ? <WiringTable wiring={lesson.wiring} /> : null}
        {lesson.commands ? <CommandsPanel commands={lesson.commands} /> : null}
        <StepsChecklist lesson={lesson} />
        {lesson.preview ? (
          <Panel title="Preview: what you should see">
            <WidgetSlot
              widget={lesson.preview.widget}
              lesson={lesson}
              name={`${lesson.id} preview`}
            />
          </Panel>
        ) : null}
      </article>
    </div>
  );
}
