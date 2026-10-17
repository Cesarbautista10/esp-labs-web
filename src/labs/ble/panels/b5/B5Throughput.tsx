import { useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { airTimeline, type LinkSettings, throughput } from "../../protocol/throughput";
import styles from "../panels.module.css";
import own from "./B5Throughput.module.css";

type Slider = "mtu" | "interval" | "cap";

const SLIDERS: readonly {
  key: Slider;
  label: string;
  min: number;
  max: number;
  step: number;
  aria: string;
}[] = [
  { key: "mtu", label: "MTU", min: 23, max: 247, step: 1, aria: "MTU in bytes" },
  {
    key: "interval",
    label: "Connection interval",
    min: 7.5,
    max: 100,
    step: 1.25,
    aria: "Connection interval in ms",
  },
  {
    key: "cap",
    label: "Radio packets the central allows per event",
    min: 1,
    max: 20,
    step: 1,
    aria: "Packets per connection event",
  },
];

const W = 660;
const X0 = 10;
const UNLIT = "var(--line)";

/** B5: the throughput calculator, with three connection events drawn to scale. */
export function B5Throughput(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [s, setS] = useState<LinkSettings>({ mtu: 247, interval: 30, cap: 6, phy: 1, dle: true });
  const svgRef = useRef<SVGSVGElement>(null);
  const model = throughput(s);
  const packets = airTimeline(s, model);
  const shown = 3 * s.interval * 1000;
  const px = W / shown;
  const shownText = {
    mtu: `${s.mtu} B (${s.mtu - 3} B of data)`,
    interval: `${s.interval} ms`,
    cap: String(s.cap),
  };

  // Packets light up as the sweep passes, once per 1.2 s: written straight onto the rects.
  useFrameLoop(
    svgRef,
    ({ now }) => {
      const phase = (now / 1200) % 1;
      svgRef.current?.querySelectorAll<SVGRectElement>("rect[data-lit]").forEach((r) => {
        const lit = Number(r.dataset.lit) / 1000 < phase * s.interval;
        r.setAttribute(
          "fill",
          lit ? (r.dataset.dir === "ack" ? "var(--ok)" : "var(--scope-violet)") : UNLIT,
        );
      });
    },
    !reduce,
  );

  return (
    <div className={styles.wd}>
      <div className={own.sliders}>
        {SLIDERS.map((x) => (
          <label key={x.key} className={own.slider}>
            <span>
              {x.label} <b>{shownText[x.key]}</b>
            </span>
            <input
              type="range"
              min={x.min}
              max={x.max}
              step={x.step}
              value={s[x.key]}
              aria-label={x.aria}
              onChange={(e) => setS((v) => ({ ...v, [x.key]: Number(e.target.value) }))}
            />
          </label>
        ))}
        <ButtonRow>
          <Button pressed={s.phy === 1} onClick={() => setS((v) => ({ ...v, phy: 1 }))}>
            1M PHY
          </Button>
          <Button pressed={s.phy === 2} onClick={() => setS((v) => ({ ...v, phy: 2 }))}>
            2M PHY
          </Button>
          <Button pressed={s.dle} onClick={() => setS((v) => ({ ...v, dle: !v.dle }))}>
            long packets: {s.dle ? "on (251 B)" : "off (27 B)"}
          </Button>
        </ButtonRow>
      </div>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 150"
          className={styles.full}
          role="img"
          aria-label="Three connection events on a time line, with every radio packet drawn to scale."
        >
          <line x1={X0} y1={92} x2={X0 + W} y2={92} className={own.axis} />
          {[0, 1, 2].map((e) => {
            const x = X0 + e * s.interval * 1000 * px;
            return (
              <g key={e}>
                <line x1={x} y1={30} x2={x} y2={110} className={own.event} />
                <text x={x + 4} y={126} className={own.eventLabel}>
                  event {e + 1} · {(e * s.interval).toFixed(1)} ms
                </text>
              </g>
            );
          })}
          {packets.map((p, i) => (
            <rect
              key={i}
              x={X0 + p.at * px}
              y={p.dir === "data" ? 58 : 94}
              width={Math.max(p.us * px, 1)}
              height={p.dir === "data" ? 26 : 10}
              rx={p.dir === "data" ? 1 : 0}
              fill={UNLIT}
              data-lit={p.litAt - p.event}
              data-dir={p.dir}
            />
          ))}
          <text x={X0} y={22} className={own.title}>
            board → central: notification packets
          </text>
          <text x={X0 + W} y={22} textAnchor="end" className={own.titleMuted}>
            central → board: empty acknowledgements (below the line)
          </text>
          <text x={X0} y={146} className={own.note}>
            {(shown / 1000).toFixed(1)} ms shown · the radios sleep in the gaps
          </text>
        </svg>
      </div>
      <p className={styles.field} aria-live="polite">
        <b>{model.kBps.toFixed(1)} kB/s</b> = {model.perEvent} notification
        {model.perEvent === 1 ? "" : "s"} × {s.mtu - 3} B per event ÷ {s.interval} ms. Each
        notification is {model.frags} radio packet
        {model.frags === 1 ? "" : "s"} ({(model.notifUs / 1000).toFixed(2)} ms with
        acknowledgements). Limited by {model.limit}.
        {model.perEvent === 0 ? (
          <>
            {" "}
            <b>Nothing fits:</b> raise the packets per event or shorten the MTU.
          </>
        ) : null}
      </p>
    </div>
  );
}
