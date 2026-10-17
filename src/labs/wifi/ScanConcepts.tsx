import { useState } from "react";
import { useInterval } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { CLEAN_CHANNELS, EXAMPLE_NETS, netName } from "./example-nets";
import styles from "./wifi.module.css";

const CHANNELS = Array.from({ length: 13 }, (_, i) => i + 1);
const HOP_MS = 900;

const TICKS = [
  ["−30", "excellent"],
  ["−55", "very good"],
  ["−67", "good"],
  ["−78", "weak"],
  ["−90", "barely there"],
] as const;

/** W1 "How a scan works": the radio hopping channels 1 to 13, and the RSSI scale. */
export function ScanConcepts(_: WidgetProps) {
  const reduce = useReducedMotion();
  // `hops` counts every channel visited so far; cells keep the dots of channels already heard.
  const [hops, setHops] = useState(0);
  useInterval(() => setHops((h) => h + 1), reduce ? null : HOP_MS);

  const ch = (hops % 13) + 1;
  const found = EXAMPLE_NETS.filter((n) => n.ch === ch);
  const clean = CLEAN_CHANNELS.includes(ch);

  return (
    <div className={styles.wd}>
      <p className={styles.goal}>
        The radio visits each 2.4 GHz channel in turn, asks “who's there?” (a probe request) and
        listens for replies and for the beacons every router sends about 10 times a second. A full
        pass takes 2–3 seconds.
      </p>
      <ol
        className={styles.hop}
        aria-label="Channels 1 to 13, the one being scanned is highlighted"
      >
        {CHANNELS.map((c) => {
          const heard = hops >= 13 || c <= ch ? EXAMPLE_NETS.filter((n) => n.ch === c).length : 0;
          return (
            <li
              key={c}
              className={`${CLEAN_CHANNELS.includes(c) ? styles.clean : ""} ${c === ch ? styles.on : ""}`}
              aria-current={c === ch ? "step" : undefined}
            >
              <span>{c}</span>
              <span className={styles.hopDots} aria-hidden="true">
                {Array.from({ length: heard }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      <div className={styles.capBox}>
        <i className={styles.sw} aria-hidden="true" />
        <strong>
          Channel {ch}
          {clean ? " · one of the three that don't overlap" : ""}
        </strong>
        <span>
          {found.length
            ? `heard ${found.length}: ${found.map(netName).join(", ")}`
            : "nothing heard here"}{" "}
          <em>(example networks)</em>
        </span>
      </div>
      <div className={styles.rssiScale} role="group" aria-label="Signal strength scale in dBm">
        <h4 className={styles.subhead}>Signal strength (RSSI)</h4>
        <div className={styles.rssiBar} aria-hidden="true" />
        <div className={styles.rssiTicks}>
          {TICKS.map(([db, word]) => (
            <span key={db}>
              <b>{db}</b>
              {word}
            </span>
          ))}
        </div>
        <Caption>
          dBm is logarithmic: every 3 dB less means half the power. −90 is a billion times weaker
          than −30.
        </Caption>
      </div>
    </div>
  );
}
