import { useState } from "react";
import { useInterval } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { type Cubic, cubicLength, cubicPath } from "./bezier";
import { LogicAnalyzer } from "./LogicAnalyzer";
import { Label, WireCaption } from "./parts";
import { cssVars, headerLabel, LEFT_HEADER, WIRES } from "./wiring-data";
import styles from "./wiring.module.css";

const DX = 262; // display header pins
const D0 = 150;
const DSTEP = 34;
const EX = 600; // ESP32 left header pins
const E0 = 44;
const ESTEP = 22;
const dY = (i: number) => D0 + i * DSTEP;
const eY = (i: number) => E0 + i * ESTEP;
const ALL = WIRES.length;

const GEOMETRY = WIRES.map((w, i) => {
  const y1 = dY(i);
  const y2 = eY(w.idx);
  const curve: Cubic = { from: [DX, y1], c1: [DX + 150, y1], c2: [EX - 160, y2], to: [EX, y2] };
  // A hair longer than the curve, so a hidden wire never shows a stub.
  return { y1, y2, d: cubicPath(curve), len: Math.ceil(cubicLength(curve)) + 2 };
});

const usedBy = (pin: number) => WIRES.findIndex((w) => w.idx === pin);

function Caption({ step }: { step: number }) {
  if (step === 0) {
    return (
      <WireCaption color="--line" title="Unplug USB first">
        Then press Play, or Next to place one wire at a time.
      </WireCaption>
    );
  }
  const w = WIRES[step - 1];
  if (step === ALL || !w) {
    return (
      <WireCaption color="--ok" title="All 8 wires placed">
        Double-check VCC is on 3V3. Press Signals to see what travels on each wire.
      </WireCaption>
    );
  }
  return (
    <WireCaption color={w.color} title={`Wire ${step}: display ${w.disp} → ${w.esp}`}>
      {w.what}
    </WireCaption>
  );
}

/** Lesson 03: the 8 display wires placed one at a time, then the signals that travel on them. */
export function DisplayWiring(_: WidgetProps) {
  const reduce = useReducedMotion();
  // step = how many wires are placed (0..8); animate = whether this change draws the wires in.
  const [view, setView] = useState({ step: 0, animate: false });
  const [playing, setPlaying] = useState(false);
  const [signals, setSignals] = useState(false);
  const { step, animate } = view;

  const show = (n: number, anim = true) =>
    setView({ step: Math.max(0, Math.min(ALL, n)), animate: anim });
  const manual = (n: number) => {
    setPlaying(false);
    show(n);
  };

  useInterval(
    () => {
      if (step >= ALL) setPlaying(false);
      else show(step + 1);
    },
    playing ? (reduce ? 2200 : 1700) : null,
  );

  function togglePlay() {
    if (playing) return setPlaying(false);
    setPlaying(true);
    if (step === 0 || step >= ALL) show(1);
  }

  function toggleSignals() {
    const on = !signals;
    setSignals(on);
    if (on) {
      setPlaying(false);
      show(ALL, false);
    } else show(step, false);
  }

  const partial = step < ALL;

  return (
    <div className={styles.wd}>
      <div className={styles.wdBar}>
        <Button onClick={() => manual(step - 1)}>◀ Prev</Button>
        <Button onClick={togglePlay}>{playing ? "Pause" : "Play"}</Button>
        <Button onClick={() => manual(step + 1)}>Next ▶</Button>
        <Button onClick={() => manual(ALL)}>Show all</Button>
        <Button pressed={signals} onClick={toggleSignals}>
          Signals
        </Button>
        <span className={styles.wdCount} aria-live="polite">
          {step} / {ALL} wires
        </span>
      </div>
      <div className={`${styles.wdSvg} ${signals ? styles.signals : ""}`}>
        <svg
          viewBox="0 0 720 566"
          role="img"
          aria-label="Wiring diagram: 8 jumper wires from the display header to the ESP32 left header"
        >
          {/* Display module: PCB, glass, header on its right edge */}
          <rect
            x="40"
            y="110"
            width="236"
            height="340"
            rx="12"
            fill="var(--pcb)"
            stroke="var(--pcb-edge)"
            strokeWidth="2"
          />
          <rect
            x="62"
            y="128"
            width="150"
            height="304"
            rx="6"
            fill="var(--scope-paper)"
            stroke="var(--pcb-edge)"
          />
          <rect
            x="70"
            y="136"
            width="134"
            height="288"
            rx="3"
            fill={step >= ALL ? "var(--scope-paper)" : "var(--scope-grid)"}
          />
          <Label x={137} y={284} anchor="middle" className={styles.silk}>
            170 × 320
          </Label>
          <Label x={137} y={298} anchor="middle" className={styles.silk}>
            ST7789 IPS
          </Label>
          <Label x={40} y={98} className={styles.title}>
            1.9″ DISPLAY MODULE
          </Label>

          {/* ESP32 header strip */}
          <rect
            x={EX - 20}
            y="20"
            width="100"
            height="526"
            rx="10"
            fill="var(--pcb)"
            stroke="var(--pcb-edge)"
            strokeWidth="2"
          />
          <Label x={EX - 20} y={14} className={styles.title}>
            ESP32-S3 · LEFT HEADER
          </Label>
          <Label x={EX + 30} y={536} anchor="middle" className={styles.silk}>
            USB ↓
          </Label>
          {LEFT_HEADER.map((pin, i) => {
            const wire = usedBy(i);
            const used = wire >= 0;
            const placed = wire < step;
            const style = used
              ? {
                  fill: placed ? "var(--silk)" : "var(--silk-dim)",
                  fontSize: 10,
                  fontWeight: wire === step - 1 ? 700 : 400,
                }
              : undefined;
            return (
              <g key={i}>
                <circle
                  cx={EX}
                  cy={eY(i)}
                  r={used ? 5 : 3.5}
                  fill={used ? "var(--pad)" : "var(--silk-dim)"}
                  opacity={used ? 1 : 0.5}
                />
                <Label x={EX + 14} y={eY(i) + 3.5} className={styles.silk} style={style}>
                  {headerLabel(pin)}
                </Label>
              </g>
            );
          })}

          {/* Wires, then the signal dashes over them, then the pin dots on top */}
          <g>
            {WIRES.map((w, i) => {
              const geo = GEOMETRY[i];
              if (!geo) return null;
              const placed = i < step;
              const current = i === step - 1;
              const cls = [
                styles.wire,
                animate && !reduce ? styles.drawing : "",
                placed && !current && partial && !signals ? styles.dim : "",
                current && partial ? styles.active : "",
              ].join(" ");
              return (
                <path
                  key={w.disp}
                  d={geo.d}
                  className={cls}
                  stroke={`var(${w.color})`}
                  style={{ strokeDasharray: geo.len, strokeDashoffset: placed ? 0 : geo.len }}
                />
              );
            })}
          </g>
          <g>
            {WIRES.map((w, i) =>
              w.speed ? (
                <path
                  key={w.disp}
                  d={GEOMETRY[i]?.d}
                  className={styles.flow}
                  style={cssVars({ "--speed": `${w.speed}s` })}
                />
              ) : null,
            )}
          </g>
          {WIRES.map((w, i) => {
            const geo = GEOMETRY[i];
            if (!geo) return null;
            const placed = i < step;
            const pulse = i === step - 1 && partial;
            const cls = `${styles.endpoint} ${pulse ? styles.active : ""}`;
            return (
              <g key={w.disp}>
                <circle
                  cx={DX}
                  cy={geo.y1}
                  r="5.5"
                  className={cls}
                  fill={`var(${w.color})`}
                  stroke="var(--pcb)"
                  strokeWidth="2"
                  opacity={placed ? 1 : 0.35}
                />
                <circle
                  cx={EX}
                  cy={geo.y2}
                  r="5.5"
                  className={cls}
                  fill={`var(${w.color})`}
                  stroke="var(--pcb)"
                  strokeWidth="2"
                  opacity={placed ? 1 : 0.35}
                />
                <Label
                  x={DX - 12}
                  y={geo.y1 + 4}
                  anchor="end"
                  className={styles.silk}
                  style={{ fill: "var(--silk)", fontSize: 11 }}
                >
                  {w.disp}
                </Label>
              </g>
            );
          })}
        </svg>
      </div>
      <Caption step={step} />
      {signals ? <LogicAnalyzer /> : null}
    </div>
  );
}
