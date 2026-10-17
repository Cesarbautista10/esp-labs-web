import type { CommandPlace, CommandState, CommandStep } from "@/domain/lesson";
import { Panel } from "@/ui/Panel";
import { RichText } from "@/ui/RichText";
import styles from "./CommandsPanel.module.css";

// What should be on, near or connected to the board while a command runs.
const STATE_LABEL: Record<CommandState, string> = {
  off: "card away",
  any: "card: doesn't matter",
  on: "card on the reader",
  both: "card + tag together",
  still: "card on, held still",
  move: "card on, then move it",
  bnone: "no phone needed",
  bscan: "phone: scanner app open",
  bconn: "phone connected",
  bpair: "phone paired",
  bhost: "paired as keyboard/MIDI",
  bperiph: "your keyboard/mouse on",
  squiet: "room quiet",
  ssound: "make some noise",
  sany: "sound: doesn't matter",
  smusic: "music near the mic",
};

const PLACE_LABEL: Record<CommandPlace, string> = {
  mac: "Mac terminal",
  button: "push button / BOOT",
  hands: "with your hands",
  app: "in the app",
  phone: "on your phone",
  serial: "serial monitor",
};

/** "Commands, in order": what to type, where, and what you should see. */
export function CommandsPanel({ commands }: { commands: readonly CommandStep[] }) {
  return (
    <Panel
      title="Commands, in order"
      intro="Type these in the serial monitor (<code>uv run pio device monitor</code>) unless the grey tag says otherwise. The coloured tag says what should be near the board while it runs."
    >
      <ol className={styles.cmds}>
        {commands.map((c, i) => (
          <li key={`${i}-${c.command}`}>
            <div className={styles.head}>
              <code>{c.command}</code>
              <span className={styles.where}>{PLACE_LABEL[c.where ?? "serial"]}</span>
              <span className={styles.state} data-state={c.card}>
                {STATE_LABEL[c.card]}
              </span>
            </div>
            <dl>
              <dt>Does</dt>
              <dd>
                <RichText text={c.does} />
              </dd>
              <dt>You should see</dt>
              <dd>
                <RichText text={c.see} />
              </dd>
              {c.fix ? (
                <>
                  <dt>If not</dt>
                  <dd>
                    <RichText text={c.fix} />
                  </dd>
                </>
              ) : null}
            </dl>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
