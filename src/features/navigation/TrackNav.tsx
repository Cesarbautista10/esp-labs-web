import type { CSSProperties } from "react";
import { Link } from "react-router";
import { TRACK_PART } from "@/content/icons";
import type { TrackId } from "@/domain/lesson";
import { lessonState, tallyStates } from "@/domain/progress";
import { useTicks } from "@/features/progress/progress-store";
import { PartIcon } from "@/ui/parts/PartIcon";
import styles from "./TrackNav.module.css";
import { useTracks } from "./use-tracks";

/**
 * The themes as one slim strip of pills. Each pill's meter has one segment per lesson, filled
 * when it works, so you can compare tracks at a glance without a wall of cards.
 */
export function TrackNav({
  activeTrack,
  view = "lab",
}: {
  activeTrack: TrackId;
  /** Which tab a theme opens on: reading the code stays reading the code. */
  view?: "lab" | "code";
}) {
  const ticks = useTicks();
  const tracks = useTracks();

  return (
    <nav className={styles.tracks} aria-label="Themes">
      <ul>
        {tracks.map(({ track, lessons }) => {
          const style = { "--track": `var(${track.color})` } as CSSProperties;
          const open = lessons?.filter((l) => l.kind === "lesson") ?? [];
          const tally = tallyStates(open, ticks);
          const working = tally.done + tally.works;
          const body = (
            <>
              <span className={styles.icon}>
                <PartIcon name={TRACK_PART[track.id]} size={28} />
              </span>
              <span className={styles.title}>{track.title}</span>
              <span className={styles.meter} aria-hidden="true">
                {open.map((l) => (
                  <i key={l.id} data-state={lessonState(l, ticks)} />
                ))}
              </span>
              <span className={styles.count}>
                {track.planned ? "soon" : lessons ? `${working}/${open.length}` : "…"}
              </span>
            </>
          );
          return (
            <li key={track.id}>
              {track.planned ? (
                <span
                  className={styles.track}
                  style={style}
                  aria-disabled="true"
                  title={`${track.title}: ${track.blurb} (planned)`}
                >
                  {body}
                </span>
              ) : (
                <Link
                  to={`/tracks/${track.id}${view === "code" ? "?view=code" : ""}`}
                  preventScrollReset
                  className={styles.track}
                  style={style}
                  title={track.blurb}
                  aria-label={`${track.title}: ${lessons ? `${working} of ${open.length} working` : "loading"}`}
                  aria-current={track.id === activeTrack ? "true" : undefined}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
