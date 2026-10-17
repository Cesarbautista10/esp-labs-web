import { useId, useState } from "react";
import { createPersistentStore, useStore } from "@/lib/storage";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { CopyCommand } from "@/ui/CopyCommand";
import type { WidgetProps } from "@/widgets/types";
import { BarChart } from "./BarChart";
import { cleanMonitor, EDGE } from "./edge-data";
import styles from "./edge.module.css";

// Your pasted tables, per experiment (same key as the original guide, so they carry over).
const pastes = createPersistentStore<Readonly<Record<string, string>>>("esp-rfid-edge", {});

/** R6 panel: one tab per experiment, the example result, and your own pasted table. */
export function RfidEdge(_: WidgetProps) {
  const [i, setI] = useState(0);
  const saved = useStore(pastes);
  const pasteId = useId();
  const e = EDGE[i] ?? EDGE[0];
  if (!e) return null;
  const text = saved[e.key] ?? "";
  const mine = text.trim() ? e.parse(cleanMonitor(text)) : [];
  const source = mine.length
    ? `Solid: your ${mine.length} rows. Thin outline beside each bar: the example.`
    : text.trim()
      ? "No rows recognised: paste the lines under the table's header."
      : "Example numbers (a typical RC522 on 15 cm jumpers), not your board. Paste your table below to replace them.";

  return (
    <div>
      <ChoiceGroup
        className={styles.tabs}
        label="Experiment"
        value={i}
        onChange={setI}
        choices={EDGE.map((x, k) => ({ key: k, label: x.label }))}
      />
      <div className={styles.body}>
        <h4>{e.label}</h4>
        <p>{e.what}</p>
        <CopyCommand command={e.cmd} />
        <BarChart e={e} mine={mine} />
        <p className={styles.src} aria-live="polite">
          {source}
        </p>
        <p>{e.look}</p>
        <div className={styles.paste}>
          <label className={styles.src} htmlFor={pasteId}>
            Paste the table from the serial monitor (the time stamps can stay):
          </label>
          <textarea
            id={pasteId}
            spellCheck={false}
            placeholder="e.g.   1     0.0 %        0 / 20"
            value={text}
            onChange={(ev) => {
              const value = ev.target.value;
              pastes.set((prev) => ({ ...prev, [e.key]: value }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
