import { useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import type { WidgetProps } from "@/widgets/types";
import { drawJourney } from "./journey-draw";
import { type JourneyLab, LABS, SND_PART } from "./journey-data";
import styles from "./journey.module.css";

function Parts({ lab }: { lab: JourneyLab }) {
  return (
    <span className={styles.parts}>
      {lab.need.map((k) => (
        <span key={k} className={styles.need}>
          {SND_PART[k]}
        </span>
      ))}
      {(lab.opt ?? []).map((k) => (
        <span key={k} className={styles.opt}>
          {SND_PART[k]} (optional)
        </span>
      ))}
    </span>
  );
}

/** S1 panel: the whole track at a glance, and the signal path of the lab you pick. */
export function SoundJourney(_: WidgetProps) {
  const [pick, setPick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useFrameLoop(canvasRef, ({ now }) => {
    const node = canvasRef.current;
    const lab = LABS[pick];
    if (!node || !lab) return;
    drawJourney(context2d(node), scopePalette(), lab, reduce ? 0.4 : now / 1000);
  });

  return (
    <div className={styles.wd}>
      <ul className={styles.journey}>
        {LABS.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              className={styles.stop}
              aria-pressed={i === pick}
              onClick={() => setPick(i)}
            >
              <b>{l.id}</b>
              <span className={styles.t}>{l.t}</span>
              <span className={styles.w}>{l.what}</span>
              <span className={styles.o}>→ {l.out}</span>
              <Parts lab={l} />
            </button>
          </li>
        ))}
      </ul>
      <canvas
        ref={canvasRef}
        width={680}
        height={120}
        role="img"
        className={styles.canvas}
        aria-label="The signal path: a sound reaches a microphone (the KY-037's voltage into the ADC, or the INMP441's numbers over I2S), the ESP32-S3 works on it, and the lab turns it into something else, often a sound on the speaker."
      />
    </div>
  );
}
