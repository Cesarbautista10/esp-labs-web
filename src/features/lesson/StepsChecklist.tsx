import { type ResolvedLesson, stepKey } from "@/domain/lesson";
import { progress, useTicks } from "@/features/progress/progress-store";
import { Panel } from "@/ui/Panel";
import { RichText } from "@/ui/RichText";
import styles from "./StepsChecklist.module.css";

/** The steps to do with your hands, ticked off as you go (saved in this browser). */
export function StepsChecklist({ lesson }: { lesson: ResolvedLesson }) {
  const ticks = useTicks();
  return (
    <Panel title="Steps">
      <ol className={styles.check}>
        {lesson.steps.map((step, i) => {
          const key = stepKey(lesson, i);
          return (
            <li key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(ticks[key])}
                  onChange={(e) => progress.setTick(key, e.target.checked)}
                />
                <span>
                  <RichText text={step} />
                </span>
              </label>
            </li>
          );
        })}
      </ol>
      {lesson.note ? (
        <p className={styles.note}>
          <RichText text={lesson.note} />
        </p>
      ) : null}
    </Panel>
  );
}
