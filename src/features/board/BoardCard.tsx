import type { ResolvedLesson } from "@/domain/lesson";
import { BoardPinout } from "./BoardPinout";
import styles from "./BoardCard.module.css";

const LEGEND = [
  ["--copper", "used in this lesson"],
  ["--pad", "safe GPIO"],
  ["--danger", "avoid"],
  ["--power", "power"],
  ["--gnd", "ground"],
  ["--w-btn", "button input"],
  ["--rfid", "RC522"],
] as const;

/** The left column: live pinout, legend and the between-lessons routine. */
export function BoardCard({ lesson }: { lesson: ResolvedLesson | null }) {
  return (
    <section id="sec-board" tabIndex={-1} className={styles.card} aria-label="Board pinout">
      <BoardPinout
        pins={lesson?.pins ?? []}
        usb={Boolean(lesson?.usb || lesson?.preview)}
        boot={Boolean(lesson?.boot)}
      />
      <ul className={styles.legend} aria-label="Legend">
        {LEGEND.map(([color, label]) => (
          <li key={label}>
            <i style={{ background: `var(${color})` }} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <details className={styles.between} open>
        <summary>Between lessons</summary>
        <ol>
          <li>
            <code>Ctrl+C</code> closes the monitor on the Mac only. The board keeps running.
          </li>
          <li>Unplug USB: this is what stops the program and the screen</li>
          <li>Rewire while off</li>
          <li>Check VCC is on 3V3, no loose ends</li>
          <li>Plug in, flash the next lesson</li>
        </ol>
        <p>
          Never unplug during <code>Writing at 0x…</code>. Pin changing from output to input? Flash
          first, then wire.
        </p>
      </details>
    </section>
  );
}
