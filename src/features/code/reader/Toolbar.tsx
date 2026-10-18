import { Link } from "react-router";
import { LEVEL_INFO } from "@/features/settings/settings";
import { settingsStore } from "@/features/settings/settings-store";
import { useEnvProgress } from "../code-progress";
import { FilePicker } from "../FilePicker";
import { type CodeFile, understood } from "../lab-code";
import { UnderstandingRing } from "../UnderstandingRing";
import { modesFor } from "./modes";
import { useReader } from "./reader-context";
import styles from "./reader.module.css";

/**
 * The reader's top row: the way back to the lab (always first), the file, how to read (Tour,
 * Story, Explore), and the view switch. The Full view adds progress, level and focus.
 */
export function Toolbar({
  file,
  onPickFile,
}: {
  file: CodeFile;
  onPickFile: (path: string) => void;
}) {
  const reader = useReader();
  const { lab, settings, simple } = reader;
  const progress = useEnvProgress(lab.env);
  const reading = understood(lab, progress);
  return (
    <div className={styles.toolbar}>
      <Link to={reader.lessonHref} className={styles.back}>
        <span aria-hidden="true">←</span> <span className={styles.wide}>Back to the </span>lab
      </Link>
      {simple ? (
        <span className={styles.fileName} title={file.path}>
          {file.name}
        </span>
      ) : (
        <FilePicker
          files={lab.files}
          current={file.path}
          level={settings.level}
          readStops={new Set(progress.stops)}
          onPick={onPickFile}
        />
      )}
      <div className={styles.modes} role="group" aria-label="How to read">
        {modesFor(simple).map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            aria-pressed={reader.mode === m.id}
            onClick={() => reader.switchMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className={styles.tools}>
        {!simple ? (
          <>
            <UnderstandingRing
              ratio={reading.ratio}
              size={34}
              label="This lab's code you have read"
            />
            <Link
              to="/settings"
              className={`${styles.level} ${styles.wide}`}
              title="Change the level in Settings"
            >
              {LEVEL_INFO[settings.level].label}
            </Link>
          </>
        ) : null}
        <button
          type="button"
          className={styles.icon}
          title={
            simple
              ? "Show every tool: files, map, words, progress"
              : "Fewer controls: one card, one button"
          }
          onClick={() => settingsStore.change("view", simple ? "full" : "simple")}
        >
          {simple ? "More tools" : "Simple view"}
        </button>
        <button
          type="button"
          className={styles.icon}
          aria-pressed={reader.focus}
          onClick={reader.toggleFocus}
          aria-label={reader.focus ? "Exit focus" : "Focus: the code fills the screen"}
          title="Focus: the code fills the screen (Esc to leave)"
        >
          <span aria-hidden="true">{reader.focus ? "✕" : "⤢"}</span>
          <span className={styles.wide}>{reader.focus ? " Exit focus" : " Focus"}</span>
        </button>
      </div>
    </div>
  );
}
