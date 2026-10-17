import { useQueries } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { trackLessonsQuery } from "@/content/queries";
import { TRACKS } from "@/content/tracks";
import type { TrackId } from "@/domain/lesson";
import { isLessonWorking } from "@/domain/progress";
import { useTicks } from "@/features/progress/progress-store";
import styles from "./TrackNav.module.css";

/**
 * The themes row. Each card shows how many lessons already work. The other tracks' content
 * loads in the background after the current lesson is on screen (one small chunk each).
 */
export function TrackNav({ activeTrack }: { activeTrack: TrackId }) {
  const ticks = useTicks();
  const contents = useQueries({ queries: TRACKS.map((t) => trackLessonsQuery(t.id)) });

  return (
    <nav className={styles.tracks} aria-label="Themes">
      {TRACKS.map((track, i) => {
        const lessons = contents[i]?.data?.filter((l) => l.kind === "lesson");
        const style = { "--track": `var(${track.color})` } as CSSProperties;
        const body = (
          <>
            <span className={styles.title}>{track.title}</span>
            <span className={styles.blurb}>{track.blurb}</span>
            <span className={styles.progress}>
              {track.planned
                ? "planned"
                : lessons
                  ? `${lessons.filter((l) => isLessonWorking(l, ticks)).length}/${lessons.length} working`
                  : "…"}
              {lessons?.map((l) => (
                <i key={l.id} className={isLessonWorking(l, ticks) ? styles.on : undefined} />
              ))}
            </span>
          </>
        );
        return track.planned ? (
          <span key={track.id} className={styles.track} style={style} aria-disabled="true">
            {body}
          </span>
        ) : (
          <Link
            key={track.id}
            to={`/tracks/${track.id}`}
            preventScrollReset
            className={styles.track}
            style={style}
            aria-current={track.id === activeTrack ? "true" : undefined}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
