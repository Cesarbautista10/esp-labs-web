import type { CSSProperties } from "react";
import { Link } from "react-router";
import { lessonPart, TRACK_PART } from "@/content/icons";
import { TRACKS } from "@/content/tracks";
import type { LessonEntry, TrackId } from "@/domain/lesson";
import { neighbours } from "@/domain/progress";
import { goToSection } from "@/lib/active-section";
import { Icon } from "@/ui/Icon";
import { PartIcon } from "@/ui/parts/PartIcon";
import styles from "./NextUp.module.css";

/** The end of a long page: where to go next (the next lesson, or the next theme), or back up. */
export function NextUp({
  lessons,
  currentId,
  trackId,
}: {
  lessons: readonly LessonEntry[];
  currentId: string;
  trackId: TrackId;
}) {
  const { prev, next } = neighbours(lessons, currentId);
  const at = TRACKS.findIndex((t) => t.id === trackId);
  const nextTrack = TRACKS.slice(at + 1).find((t) => !t.planned);

  return (
    <nav className={styles.next} aria-label="Next">
      {next ? (
        <Link to={`/lessons/${next.id}`} className={styles.primary}>
          <PartIcon name={lessonPart(next.id, next.track)} size={64} className={styles.part} />
          <span className={styles.kicker}>Next lesson</span>
          <span className={styles.title}>
            <b>{next.id}</b> {next.title}
          </span>
          <Icon name="arrow" size={22} />
        </Link>
      ) : nextTrack ? (
        <Link
          to={`/tracks/${nextTrack.id}`}
          className={styles.primary}
          style={{ "--track": `var(${nextTrack.color})` } as CSSProperties}
        >
          <PartIcon name={TRACK_PART[nextTrack.id]} size={64} className={styles.part} />
          <span className={styles.kicker}>End of this theme · next theme</span>
          <span className={styles.title}>{nextTrack.title}</span>
          <Icon name="arrow" size={22} />
        </Link>
      ) : (
        <Link to="/" className={styles.primary}>
          <span className={styles.kicker}>That was the last lesson</span>
          <span className={styles.title}>Back to the labs map</span>
          <Icon name="grid" size={22} />
        </Link>
      )}
      <div className={styles.minor}>
        {prev ? (
          <Link to={`/lessons/${prev.id}`}>
            <Icon name="back" size={15} /> {prev.id} {prev.title}
          </Link>
        ) : (
          <Link to="/">
            <Icon name="grid" size={15} /> All labs
          </Link>
        )}
        <button type="button" onClick={() => goToSection("sec-goal")}>
          <Icon name="up" size={15} /> Back to the top
        </button>
      </div>
    </nav>
  );
}
