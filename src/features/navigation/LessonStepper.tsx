import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { LessonEntry } from "@/domain/lesson";
import { isLessonDone } from "@/domain/progress";
import { useTicks } from "@/features/progress/progress-store";
import styles from "./LessonStepper.module.css";

/** The lessons of one theme, in order: numbering carries meaning. */
export function LessonStepper({
  lessons,
  currentId,
}: {
  lessons: readonly LessonEntry[];
  currentId: string;
}) {
  const ticks = useTicks();
  const currentRef = useRef<HTMLAnchorElement>(null);

  // On a phone the stepper scrolls sideways: keep the open lesson visible.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentId]);

  return (
    <nav className={styles.steps} aria-label="Lessons in this theme">
      <ol>
        {lessons.map((l) => {
          const done = isLessonDone(l, ticks);
          const body = (
            <>
              <span className={styles.n}>{l.id}</span>
              <span className={styles.t}>{l.title}</span>
              <span className={styles.st} data-done={done}>
                {done ? "done" : l.status}
              </span>
            </>
          );
          return (
            <li key={l.id}>
              {l.kind === "planned" ? (
                <span className={styles.step} aria-disabled="true">
                  {body}
                </span>
              ) : (
                <Link
                  ref={l.id === currentId ? currentRef : undefined}
                  to={`/lessons/${l.id}`}
                  preventScrollReset
                  className={styles.step}
                  aria-current={l.id === currentId ? "page" : undefined}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
