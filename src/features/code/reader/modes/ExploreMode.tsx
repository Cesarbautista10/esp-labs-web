import { RichText } from "@/ui/RichText";
import panel from "../../panels.module.css";
import { stopsFor } from "../../lab-code";
import { ReaderFrame } from "../ReaderFrame";
import { useReader } from "../reader-context";
import styles from "../reader.module.css";

/** No path to follow: every line and word explains itself when tapped. */
export function ExploreMode() {
  const reader = useReader();
  const file = reader.file(reader.params.get("file"));
  const stops = stopsFor(file, reader.settings.level);
  return (
    <ReaderFrame
      file={file}
      guide={
        <article className={panel.card}>
          <p className={panel.eyebrow}>Explore</p>
          <h3 className={panel.title}>Tap any line</h3>
          <p className={panel.say}>
            Every line explains itself: tap it to see what it does. Underlined words are in the
            phrasebook: tap one to learn it. Map shows the shape of the program.
          </p>
          <p className={panel.say}>
            <RichText text={reader.lab.bigPicture} />
          </p>
        </article>
      }
      bar={
        <div className={styles.stepBar}>
          <p className={styles.barHint}>Tap any line or underlined word.</p>
          {stops.length ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => reader.switchMode("tour")}
            >
              Take the tour ({stops.length} stops)
            </button>
          ) : null}
        </div>
      }
    />
  );
}
