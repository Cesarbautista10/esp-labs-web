import type { ResolvedLesson } from "@/domain/lesson";
import { CopyCommand } from "@/ui/CopyCommand";
import { Panel } from "@/ui/Panel";
import { RichText } from "@/ui/RichText";
import styles from "./LessonHeader.module.css";
import { VariantSwitch } from "./VariantSwitch";

/** Title card: what the lesson is for, what "done" means, and the one command to run. */
export function LessonHeader({
  lesson,
  onVariant,
}: {
  lesson: ResolvedLesson;
  onVariant: (key: string) => void;
}) {
  return (
    <Panel labelledBy={`lesson-${lesson.id}-title`}>
      <p className={styles.eyebrow}>Lesson {lesson.id}</p>
      {lesson.variants ? (
        <VariantSwitch
          variants={lesson.variants}
          current={lesson.variantKey}
          onChange={onVariant}
        />
      ) : null}
      <h2 id={`lesson-${lesson.id}-title`} className={styles.heading}>
        {lesson.heading}
      </h2>
      <p className={styles.goal}>
        <RichText text={lesson.goal} />
      </p>
      {lesson.goalCheck ? (
        <div className={styles.goalbox}>
          <b>Goal</b>
          {lesson.goalLine ? (
            <p>
              <RichText text={lesson.goalLine} />
            </p>
          ) : null}
          <p className={styles.doneWhen}>You're done when</p>
          <ul>
            {lesson.goalCheck.map((c) => (
              <li key={c}>
                <RichText text={c} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className={styles.learn} aria-label="You will learn">
        {lesson.learn.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      {lesson.cmd ? <CopyCommand command={lesson.cmd} /> : null}
    </Panel>
  );
}
