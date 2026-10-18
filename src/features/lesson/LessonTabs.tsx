import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import type { ResolvedLesson } from "@/domain/lesson";
import { useAllProgress } from "@/features/code/code-progress";
import { envOfCommand, firmwareIndexQuery } from "@/features/code/queries";
import styles from "./LessonTabs.module.css";

/**
 * Two ways into a lesson: do it on the bench, or read the code that runs on the board. Same
 * lesson, same variant; each tab says what it holds so neither feels like a detour.
 */
export function LessonTabs({
  lesson,
  current,
}: {
  lesson: ResolvedLesson;
  current: "lab" | "code";
}) {
  const [params] = useSearchParams();
  const env = envOfCommand(lesson.cmd);
  const { data: index } = useQuery({ ...firmwareIndexQuery(), enabled: !!env });
  const progress = useAllProgress();
  if (!env) return null;
  const files = index?.envs.find((e) => e.env === env)?.files ?? [];
  const own = files.filter((f) => f.role === "lab");
  const lines = own.reduce((n, f) => n + f.lines, 0);
  const read = progress[env]?.stops.length ?? 0;
  const variant = params.get("variant");
  const search = variant ? `?variant=${encodeURIComponent(variant)}` : "";

  return (
    <nav className={styles.tabs} aria-label="Lesson views">
      <Link
        to={`/lessons/${lesson.id}${search}`}
        aria-current={current === "lab" ? "page" : undefined}
      >
        <span className={styles.label}>Do the lab</span>
        <span className={styles.sub}>wire · flash · check</span>
      </Link>
      <Link
        to={`/lessons/${lesson.id}/code${search}`}
        aria-current={current === "code" ? "page" : undefined}
      >
        <span className={styles.label}>
          Read the code{" "}
          {read ? (
            <span className={styles.read}>
              {read} {read === 1 ? "stop" : "stops"} read
            </span>
          ) : null}
        </span>
        <span className={styles.sub}>
          {own.length
            ? `${own.length} ${own.length === 1 ? "file" : "files"} · ${lines} lines · guided tour`
            : "guided tour · tap any line"}
        </span>
      </Link>
    </nav>
  );
}
