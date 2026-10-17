import { type KeyboardEvent, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import styles from "../panels.module.css";
import own from "./BleJourney.module.css";

type Flow = "in" | "out" | "both";

interface Stage {
  readonly id: string;
  readonly t: string;
  readonly role: string;
  readonly what: string;
  readonly arrow: Flow;
  readonly lock?: boolean;
}

const STAGES: readonly Stage[] = [
  { id: "B1", t: "Listen", role: "scanner", what: "hears every device's advertising", arrow: "in" },
  { id: "B2", t: "Be seen", role: "broadcaster", what: "shouts its own live data", arrow: "out" },
  {
    id: "B3",
    t: "Connect & talk",
    role: "peripheral",
    what: "is read and written by your phone",
    arrow: "both",
  },
  {
    id: "B4",
    t: "Pair & trust",
    role: "peripheral + keys",
    what: "adds encryption, passkeys and bonds",
    arrow: "both",
    lock: true,
  },
  {
    id: "B5",
    t: "Phone app",
    role: "peripheral",
    what: "talks to your own web app over Web Bluetooth",
    arrow: "both",
  },
  {
    id: "B6",
    t: "Keyboard & media",
    role: "HID peripheral",
    what: "types and changes the volume",
    arrow: "out",
    lock: true,
  },
  {
    id: "B7",
    t: "Music",
    role: "MIDI peripheral",
    what: "plays notes in GarageBand",
    arrow: "both",
  },
  {
    id: "B8",
    t: "Host",
    role: "central",
    what: "lets your keyboard type onto it",
    arrow: "in",
    lock: true,
  },
];

const pos = (i: number) => ({ x: 50 + (i % 4) * 166, y: i < 4 ? 66 : 190 });
const FLOW_TEXT: Readonly<Record<Flow, string>> = {
  in: "into the board",
  out: "out of the board",
  both: "both ways",
};

/** B1: the whole track at a glance, from listening to hosting. */
export function BleJourney({ lesson }: WidgetProps) {
  const [pick, setPick] = useState(() =>
    Math.max(
      0,
      STAGES.findIndex((s) => s.id === lesson.id),
    ),
  );
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);

  // Each lab's dot runs along its card in the direction the data flows.
  useFrameLoop(
    svgRef,
    ({ now }) => {
      const k = (now / 1400) % 1;
      const odd = Math.floor(now / 1400) % 2 === 1;
      STAGES.forEach((s, i) => {
        const dot = dots.current[i];
        if (!dot) return;
        const { x } = pos(i);
        const back = s.arrow === "in" || (s.arrow === "both" && odd);
        dot.setAttribute("cx", String(x - 26 + (back ? 1 - k : k) * 126));
        dot.setAttribute("opacity", s.arrow === "both" ? (odd ? "1" : "0.6") : "1");
      });
    },
    !reduce,
  );

  const s = STAGES[pick] ?? STAGES[0];
  const choose = (i: number) => (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setPick(i);
  };

  return (
    <div className={styles.wd}>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 260"
          className={styles.full}
          role="group"
          aria-label="The eight Bluetooth labs as a path: what the board does in each and which way data flows."
        >
          <path
            d="M 160 66 H 180 M 326 66 H 346 M 492 66 H 512 M 658 66 Q 672 66 672 128 Q 672 190 658 190 M 160 190 H 180 M 326 190 H 346 M 492 190 H 512"
            className={own.path}
          />
          {STAGES.map((st, i) => {
            const { x, y } = pos(i);
            return (
              <g
                key={st.id}
                tabIndex={0}
                role="button"
                aria-pressed={i === pick}
                aria-label={`${st.id} ${st.t}: ${st.what}`}
                className={own.stage}
                onClick={() => setPick(i)}
                onKeyDown={choose(i)}
              >
                <rect
                  x={x - 36}
                  y={y - 34}
                  width={146}
                  height={68}
                  rx={10}
                  className={own.card}
                  data-on={i === pick}
                />
                <text x={x - 26} y={y - 14} className={own.id}>
                  {st.id}
                </text>
                <text x={x + 2} y={y - 14} className={own.title}>
                  {st.t}
                </text>
                <text x={x - 26} y={y + 4} className={own.role}>
                  {st.role}
                </text>
                {st.lock ? (
                  <text x={x + 92} y={y + 4} className={own.role}>
                    🔒
                  </text>
                ) : null}
                <circle
                  ref={(el) => {
                    dots.current[i] = el;
                  }}
                  cx={x}
                  cy={y + 20}
                  r={4}
                  className={own.dot}
                />
              </g>
            );
          })}
        </svg>
      </div>
      {s ? (
        <Caption live>
          {s.id} {s.t}: the board is the {s.role} and {s.what}. Data flows {FLOW_TEXT[s.arrow]}.
        </Caption>
      ) : null}
    </div>
  );
}
