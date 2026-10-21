import { useId, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { useSimulation } from "../../shared/simulation";
import { FIELD, isHeard, isPowered, rangeAt, WUPA_SYMBOLS } from "../protocol/field";
import { StepCaption } from "../panels/StepCaption";
import styles from "./f3d.module.css";
import { buildFieldScene, initialField, sendWupa } from "./field-scene";
import { FieldChart } from "./FieldChart";
import { StageBox } from "@/ui/stage3d/StageBox";
import { useStage3d } from "@/ui/stage3d/use-stage";

/** R2 panel: the reader's field in 3D, a card at a chosen height and gain, and one wake-up. */
export function RfidField3d(_: WidgetProps) {
  const [sim, snapshot] = useSimulation(initialField);
  const [spinning, setSpinning] = useState(() => !prefersReducedMotion());
  const ids = useId();
  const { boxRef, canvasRef, labelsRef, stageRef, status } = useStage3d(
    {
      target: { x: 0.6, y: 1.4, z: 0 },
      radius: 13,
      az: 0.9,
      el: 0.5,
      ground: { w: 11, d: 8, y: -0.17 },
    },
    (T, stage) => buildFieldScene(T, stage, sim),
  );
  const st = snapshot.state;
  const db = FIELD.gains[st.gain] ?? 33;
  const powered = isPowered(st.dist);
  const heard = isHeard(st.dist, db);
  const ready = status === "ready";

  return (
    <div className={styles.f3d}>
      <StageBox
        boxRef={boxRef}
        canvasRef={canvasRef}
        labelsRef={labelsRef}
        stageRef={stageRef}
        status={status}
        label="3D view: the RC522 board with its antenna coil, the magnetic field lines around it, and a card held above it. Drag to turn."
        fallback="The chart and controls below still work."
      />
      <div className={styles.ctl}>
        <label htmlFor={`${ids}d`}>
          Card height above the antenna <output htmlFor={`${ids}d`}>{st.dist} mm</output>
          <input
            id={`${ids}d`}
            type="range"
            min={0}
            max={80}
            step={1}
            value={st.dist}
            onChange={(e) => sim.update((s) => (s.dist = Number(e.target.value)))}
          />
        </label>
        <label htmlFor={`${ids}g`}>
          Receiver gain (RFCfgReg) <output htmlFor={`${ids}g`}>{db} dB</output>
          <input
            id={`${ids}g`}
            type="range"
            min={0}
            max={FIELD.gains.length - 1}
            step={1}
            value={st.gain}
            onChange={(e) => sim.update((s) => (s.gain = Number(e.target.value)))}
          />
        </label>
        <ButtonRow>
          <Button
            disabled={!ready}
            onClick={() => sim.update((s) => sendWupa(s, performance.now() / 1000))}
          >
            ▶ Send WUPA
          </Button>
          <Button
            disabled={!ready}
            pressed={spinning}
            onClick={() => {
              const stage = stageRef.current;
              if (!stage) return;
              stage.view.spinning = !stage.view.spinning;
              setSpinning(stage.view.spinning);
            }}
          >
            Turn
          </Button>
          <Button
            disabled={!ready}
            pressed={st.slice}
            onClick={() => sim.update((s) => (s.slice = !s.slice))}
          >
            One slice
          </Button>
        </ButtonRow>
      </div>
      <div className={styles.pills} aria-live="polite">
        <span className={powered ? styles.yes : styles.no}>
          {powered ? "card powered" : "card has no power"}
        </span>
        <span className={!powered ? "" : heard ? styles.yes : styles.no}>
          {!powered
            ? "reader hears it: nothing to hear"
            : heard
              ? "reader hears it"
              : "reader can't hear it"}
        </span>
        <span>{`range at ${db} dB: about ${Math.round(rangeAt(db))} mm`}</span>
      </div>
      <div className={styles.bitstrip} role="group" aria-label="What is on the air right now">
        {WUPA_SYMBOLS.map((s, j) => (
          <span key={j} className={j === st.sym ? styles.now : undefined}>
            {s.s}
            <small>{s.t}</small>
          </span>
        ))}
      </div>
      <FieldChart dist={st.dist} db={db} />
      <StepCaption title={st.cap[0]} text={st.cap[1]} token="--w-sda" />
    </div>
  );
}
