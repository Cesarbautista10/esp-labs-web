import { type CSSProperties, useState } from "react";
import { useInterval } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { hx } from "../../protocol/hex";
import styles from "../panels.module.css";
import { anatomy, SAMPLE_KEYS, SAMPLES, type SampleKey } from "./anatomy-packet";

/** B1: one advertising packet on air, field by field. */
export function BleAnatomy(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [sample, setSample] = useState<SampleKey>("phone");
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const { fields, used } = anatomy(sample);
  const n = fields.length;
  const go = (d: number) => setAt((a) => (a + d + n) % n);

  useInterval(() => go(1), playing ? 2600 : null);

  const current = fields[at] ?? fields[0];
  return (
    <div className={styles.wd}>
      <div className={styles.ctl}>
        <select
          className={styles.select}
          aria-label="Which device"
          value={sample}
          onChange={(e) => {
            const key = SAMPLE_KEYS.find((k) => k === e.target.value);
            if (key) setSample(key);
            setAt(0);
          }}
        >
          {SAMPLE_KEYS.map((k) => (
            <option key={k} value={k}>
              {SAMPLES[k].label}
            </option>
          ))}
        </select>
        <Button
          aria-label="Previous field"
          onClick={() => {
            setPlaying(false);
            go(-1);
          }}
        >
          ◀
        </Button>
        <Button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
          {playing ? "❚❚" : "▶"}
        </Button>
        <Button
          aria-label="Next field"
          onClick={() => {
            setPlaying(false);
            go(1);
          }}
        >
          ▶
        </Button>
      </div>
      <div className={styles.bytes} role="list" aria-label="Packet bytes">
        {fields.map((f, i) => (
          <span
            key={f.name}
            role="listitem"
            className={`${styles.bf} ${i === at ? styles.on : ""}`}
            style={{ "--bf": f.col } as CSSProperties}
          >
            <b>{f.name}</b>
            {f.bytes.map((b, j) => (
              <i key={j}>{hx(b)}</i>
            ))}
          </span>
        ))}
        <span className={styles.used}>{used}/31 data bytes used</span>
      </div>
      {current ? (
        <p className={styles.field} aria-live={playing ? "off" : "polite"}>
          {at + 1}/{n} · {current.what}
        </p>
      ) : null}
    </div>
  );
}
