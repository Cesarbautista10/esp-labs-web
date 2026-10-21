import type { CSSProperties } from "react";
import { DEFAULT_LESSON_ID } from "@/content/tracks";
import { continueLesson, lessonState, tallyStates } from "@/domain/progress";
import { useTracks } from "@/features/navigation/use-tracks";
import { StateLegend } from "@/features/progress/LessonState";
import { progress, useTicks } from "@/features/progress/progress-store";
import { useStore } from "@/lib/storage";
import { Icon } from "@/ui/Icon";
import { BoardExplorer } from "./board3d/BoardExplorer";
import { ContinueCard } from "./ContinueCard";
import styles from "./LabsHome.module.css";
import { TraceDecor } from "./TraceDecor";
import { TrackCard } from "./TrackCard";

/**
 * The labs at a glance, on drafting paper: where you are, the lesson to pick up, the board
 * itself in 3D (each part with the labs that use it), then every theme as a row of lesson tiles.
 */
export function LabsHome() {
  const ticks = useTicks();
  const lastId = useStore(progress.lastLesson);
  const tracks = useTracks();
  const all = tracks.flatMap((t) => t.lessons ?? []);
  const open = all.filter((l) => l.kind === "lesson");
  const tally = tallyStates(open, ticks);
  const working = tally.works + tally.done;
  const next = continueLesson(all, lastId ?? DEFAULT_LESSON_ID, ticks);
  const nextTrack = tracks.find((t) => t.track.id === next?.track)?.track;

  return (
    <div className={styles.home}>
      <TraceDecor />
      <header className={styles.top} aria-labelledby="home-title">
        <div className={styles.brand}>
          <p className={styles.kicker}>ESP32-S3 · N16R8 · bench guide</p>
          <h2 id="home-title" className={styles.title}>
            ESP32 <span>Labs</span>
          </h2>
          <p className={styles.motto}>
            <span>Wire</span>
            <span>Flash</span>
            <span>Watch</span>
            <span>Read the code</span>
          </p>
        </div>

        <section className={styles.hud} aria-labelledby="hud-title">
          <p id="hud-title" className={styles.hudHead}>
            <Icon name="board" size={20} />
            <span>Labs working</span>
            <b>
              {working}
              <small>/{open.length}</small>
            </b>
          </p>
          <ol className={styles.strip} aria-label="Every lab, by theme">
            {tracks
              .filter((t) => t.lessons?.length)
              .map(({ track, lessons }) => (
                <li key={track.id} style={{ "--track": `var(${track.color})` } as CSSProperties}>
                  {lessons
                    ?.filter((l) => l.kind === "lesson")
                    .map((l) => (
                      <i
                        key={l.id}
                        data-state={lessonState(l, ticks)}
                        title={`${l.id} ${l.title}`}
                      />
                    ))}
                </li>
              ))}
          </ol>
          <dl className={styles.stats}>
            <div data-state="works">
              <dt>on the board</dt>
              <dd>{working}</dd>
            </div>
            <div data-state="done">
              <dt>done by you</dt>
              <dd>{tally.done}</dd>
            </div>
            <div data-state="built">
              <dt>ready to try</dt>
              <dd>{tally.built}</dd>
            </div>
          </dl>
        </section>

        {next && next.kind === "lesson" && nextTrack ? (
          <ContinueCard
            lesson={next}
            track={nextTrack}
            state={lessonState(next, ticks)}
            resumed={next.id === lastId}
          />
        ) : null}
      </header>

      <section className={styles.board} aria-labelledby="board-title">
        <div className={styles.sectionHead}>
          <h2 id="board-title">Meet the board</h2>
          <p>
            Six parts you will use lab after lab. Drag the board to turn it; pick a part to light it
            up and see which labs use it.
          </p>
        </div>
        <BoardExplorer lessons={all} />
      </section>

      <section className={styles.map} aria-labelledby="map-title">
        <div className={styles.sectionHead}>
          <h2 id="map-title">All labs</h2>
          <StateLegend />
        </div>
        <div className={styles.cards}>
          {tracks.map(({ track, lessons }) => (
            <TrackCard key={track.id} track={track} lessons={lessons} ticks={ticks} />
          ))}
        </div>
      </section>
    </div>
  );
}
