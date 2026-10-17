import { useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { HoldButton } from "@/ui/board-button/BoardButton";
import { type Cubic, cubicAtFraction, cubicPath } from "./bezier";
import { Label, WireCaption } from "./parts";
import { cssVars, headerLabel, LEFT_HEADER, WIRES } from "./wiring-data";
import styles from "./wiring.module.css";

const EX = 600;
const eY = (i: number) => 50 + i * 22;
const DX = 252;
const dY = (i: number) => 76 + i * 32;
const BTN_PIN = 4; // GPIO 5 on the left header
const GND_PIN = 21;
const PULSE_MS = 500;

const SCREEN_WIRES = WIRES.map((w, i) => ({
  ...w,
  y1: dY(i),
  d: cubicPath({
    from: [DX, dY(i)],
    c1: [DX + 150, dY(i)],
    c2: [EX - 170, eY(w.idx)],
    to: [EX, eY(w.idx)],
  }),
}));
const SIGNAL: Cubic = {
  from: [144, 446],
  c1: [330, 430],
  c2: [EX - 200, eY(BTN_PIN) + 10],
  to: [EX, eY(BTN_PIN)],
};
const GROUND: Cubic = {
  from: [216, 518],
  c1: [300, 560],
  c2: [EX - 160, eY(GND_PIN) + 30],
  to: [EX, eY(GND_PIN)],
};
const LEGS = [
  [144, 446, "A"],
  [216, 446, "B"],
  [144, 518, "C"],
  [216, 518, "D"],
] as const;

type Mode = "both" | "screen" | "button";
const MODES: readonly { key: Mode; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "screen", label: "Screen · 8 wires" },
  { key: "button", label: "Button · 2 wires" },
];

const CAPTIONS: Record<Mode, { color: string; title: string; text: string }> = {
  both: {
    color: "--copper",
    title: "10 wires on one header",
    text: "8 go to the screen (an output), 2 go to the button (an input). Both need a GND; any GND pin works. Pin 5 sits right next to 4, so check the label.",
  },
  screen: {
    color: "--w-scl",
    title: "Screen: an output on 8 wires",
    text: "Power (VCC, GND), the SPI bus (SCL, SDA), and control lines (CS, DC, RES, BLK). Data flows from the ESP32 to the screen, millions of bits a second.",
  },
  button: {
    color: "--w-btn",
    title: "Button: an input on 2 wires",
    text: "GPIO 5 and GND. No power wire: the chip's internal pull-up holds GPIO 5 HIGH, and pressing joins it to GND (LOW). Press the button to see the signal travel in.",
  },
};

function pinStyle(i: number) {
  if (i === BTN_PIN) return { fill: "var(--w-btn)", fontWeight: 700, fontSize: 10 };
  if (WIRES.some((w) => w.idx === i)) return { fill: "var(--silk)", fontSize: 10 };
  return undefined;
}

/** Lesson 03b variation 2: the screen (output) and the push button (input) on one header. */
export function FullWiring(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("both");
  const [down, setDown] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const pulseStart = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<SVGCircleElement>(null);
  const showS = mode !== "button";
  const showB = mode !== "screen";
  const caption = CAPTIONS[mode];

  // Press: the knob goes down, GPIO 5 drops LOW, and a pulse travels from the button to the pin.
  function pressDown() {
    setDown(true);
    if (mode === "screen") setMode("both");
    pulseStart.current = performance.now();
    setPulsing(true);
  }

  useFrameLoop(
    wrapRef,
    ({ now }) => {
      const dot = pulseRef.current;
      if (!dot) return;
      const k = Math.min(1, (now - pulseStart.current) / (reduce ? 1 : PULSE_MS));
      const [x, y] = cubicAtFraction(SIGNAL, k);
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("opacity", k < 1 ? "1" : "0");
      if (k >= 1) setPulsing(false);
    },
    pulsing,
  );

  const buttonWire = `${styles.wire} ${showB ? "" : styles.dim} ${down ? styles.active : ""}`;

  return (
    <div className={styles.wd}>
      <div className={styles.wdBar} role="group" aria-label="Show">
        <span className={styles.show} aria-hidden="true">
          Show
        </span>
        {MODES.map((m) => (
          <Button key={m.key} pressed={mode === m.key} onClick={() => setMode(m.key)}>
            {m.label}
          </Button>
        ))}
        <HoldButton
          down={down}
          aria-label="Press the drawn button"
          onDown={pressDown}
          onUp={() => setDown(false)}
        >
          PRESS
        </HoldButton>
      </div>
      <div ref={wrapRef} className={`${styles.wdSvg} ${styles.signals}`}>
        <svg
          viewBox="0 0 760 600"
          role="img"
          aria-label="The ESP32 left header with the display wired to 8 pins and the push button wired to GPIO 5 and GND"
        >
          {/* ESP32 left header */}
          <rect
            x={EX - 20}
            y="24"
            width="110"
            height="528"
            rx="10"
            fill="var(--pcb)"
            stroke="var(--pcb-edge)"
            strokeWidth="2"
          />
          <Label x={EX - 20} y={16} className={styles.title}>
            ESP32-S3 · LEFT HEADER
          </Label>
          <Label x={EX + 35} y={568} className={styles.silk} anchor="middle">
            USB ↓
          </Label>
          {LEFT_HEADER.map((pin, i) => (
            <g key={i}>
              <circle cx={EX} cy={eY(i)} r="4" fill="var(--silk-dim)" opacity="0.6" />
              <Label x={EX + 14} y={eY(i) + 3.5} className={styles.silk} style={pinStyle(i)}>
                {headerLabel(pin)}
              </Label>
            </g>
          ))}

          {/* Display module (top-left) */}
          <rect
            x="30"
            y="40"
            width="220"
            height="290"
            rx="12"
            fill="var(--pcb)"
            stroke="var(--pcb-edge)"
            strokeWidth="2"
          />
          <rect x="50" y="58" width="136" height="254" rx="4" fill="var(--scope-paper)" />
          <Label x={118} y={182} className={styles.silk} anchor="middle">
            SCREEN
          </Label>
          <Label x={118} y={196} className={styles.silk} anchor="middle">
            output
          </Label>
          <Label x={30} y={32} className={styles.title}>
            1.9″ DISPLAY · OUTPUT
          </Label>

          {/* Push button (bottom-left) */}
          <Label x={110} y={418} className={styles.title}>
            PUSH BUTTON · INPUT
          </Label>
          <rect
            x="130"
            y="432"
            width="100"
            height="100"
            rx="10"
            fill="var(--pcb)"
            stroke="var(--pcb-edge)"
            strokeWidth="2"
          />
          <circle
            cx="180"
            cy="482"
            r="24"
            fill={down ? "var(--w-btn)" : "var(--pcb-edge)"}
            stroke="var(--silk-dim)"
            strokeWidth="2"
          />
          {LEGS.map(([x, y, k]) => (
            <g key={k}>
              <circle cx={x} cy={y} r="4" fill="var(--silk-dim)" />
              <Label
                x={x + (x < 180 ? -10 : 10)}
                y={y + 4}
                className={styles.silk}
                anchor={x < 180 ? "end" : "start"}
              >
                {k}
              </Label>
            </g>
          ))}

          {/* Screen wires: data flows out of the ESP32 */}
          {SCREEN_WIRES.map((w) => (
            <g key={w.disp}>
              <path
                d={w.d}
                className={`${styles.wire} ${showS ? "" : styles.dim}`}
                stroke={`var(${w.color})`}
              />
              {w.speed && showS && !reduce ? (
                <path
                  d={w.d}
                  className={`${styles.flow} ${styles.flowOut}`}
                  style={cssVars({ "--speed": `${w.speed}s` })}
                />
              ) : null}
              <circle
                cx={DX}
                cy={w.y1}
                r="5"
                fill={`var(${w.color})`}
                stroke="var(--pcb)"
                strokeWidth="2"
              />
              <Label
                x={DX - 10}
                y={w.y1 + 4}
                className={styles.silk}
                anchor="end"
                style={{ fill: "var(--silk)", fontSize: 11 }}
              >
                {w.disp}
              </Label>
            </g>
          ))}
          {/* Button wires: GPIO 5 and GND */}
          <path d={cubicPath(SIGNAL)} className={buttonWire} stroke="var(--w-btn)" />
          <path d={cubicPath(GROUND)} className={buttonWire} stroke="var(--w-gnd)" />
          <circle ref={pulseRef} r="6" fill="var(--w-btn)" opacity="0" />
          {WIRES.map((w) => (
            <circle
              key={w.disp}
              cx={EX}
              cy={eY(w.idx)}
              r="5.5"
              fill={`var(${w.color})`}
              stroke="var(--pcb)"
              strokeWidth="2"
            />
          ))}
          <circle
            cx={EX}
            cy={eY(BTN_PIN)}
            r="5.5"
            fill="var(--w-btn)"
            stroke="var(--pcb)"
            strokeWidth="2"
          />

          {/* Direction labels */}
          <Label
            x={400}
            y={40}
            className={`${styles.lbl} ${styles.on}`}
            anchor="middle"
            style={{ opacity: showS ? 1 : 0.25 }}
          >
            OUT → ESP32 talks to the screen
          </Label>
          <Label
            x={130}
            y={586}
            className={`${styles.lbl} ${styles.on}`}
            style={{ opacity: showB ? 1 : 0.25 }}
          >
            IN ← ESP32 listens to the button
          </Label>
          <Label x={EX - 12} y={eY(GND_PIN) + 46} anchor="end">
            screen and button GND: any GND pin works
          </Label>
          <Label
            x={EX - 40}
            y={eY(BTN_PIN) - 14}
            className={`${styles.lbl} ${styles.on}`}
            anchor="end"
          >
            {down ? "GPIO 5 = LOW (pressed)" : "GPIO 5 = HIGH"}
          </Label>
        </svg>
      </div>
      <WireCaption color={caption.color} title={caption.title}>
        {caption.text}
      </WireCaption>
    </div>
  );
}
