import { type CSSProperties, type MouseEvent, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { useSimulation } from "../../shared/simulation";
import { hx } from "../protocol/bytes";
import { blockKind, byteRole, exampleCard, KIND_TOKEN } from "../protocol/card-memory";
import panels from "../panels/panels.module.css";
import { StepCaption } from "../panels/StepCaption";
import styles from "./f3d.module.css";
import {
  buildMemoryScene,
  initialMemory,
  type MemoryState,
  type SectorPicker,
} from "./memory-scene";
import { StageBox } from "./StageBox";
import { useStage3d } from "./use-stage";

const OPEN_LEGEND = [
  ["--danger", "key A (reads as 00)"],
  ["--copper", "access bits"],
  ["--gnd", "user byte"],
  ["--w-sda", "key B · value"],
  ["--w-cs", "UID + BCC"],
  ["--ok", "your text"],
] as const;

const swatch = (token: string) => ({ "--key": `var(${token})` }) as CSSProperties;

// Takes the fields it reads, not the whole state: the state object is mutated in place, so the
// React Compiler would keep a result computed from it.
function caption(
  sector: number,
  isOpen: boolean,
  handshake: MemoryState["anim"],
): readonly [string, string] {
  if (handshake)
    return [
      "3-pass authentication",
      `The chip asks the card for sector ${handshake.s} with key A; the card sends a random challenge, the chip answers with its own, and both prove they know the key without ever sending it. From now on Crypto1 encrypts every frame.`,
    ];
  const s = sector;
  const first = s * 4;
  return isOpen
    ? [
        `Sector ${s}, open`,
        `Authenticated with key A (the factory key FF FF FF FF FF FF). Blocks ${first}–${first + 3} can be read. Key A reads back as 00: the card never reveals it. Bytes 6–8 of the trailer are the access bits; byte 9 is free.`,
      ]
    : [
        `Sector ${s}, locked`,
        `Blocks ${first}–${first + 3} stay unreadable until the reader proves it knows this sector's key: press Authenticate.`,
      ];
}

/** R4 panel: the card's memory as 16 cabinets; authenticate a sector to read its blocks. */
export function RfidMemory3d(_: WidgetProps) {
  const [sim, snapshot] = useSimulation(initialMemory);
  const [spinning, setSpinning] = useState(() => !prefersReducedMotion());
  const pick = useRef<SectorPicker | null>(null);
  const { boxRef, canvasRef, labelsRef, stageRef, status } = useStage3d(
    { target: { x: 0, y: 1.0, z: 0 }, radius: 17, az: 0.75, el: 0.55 },
    (T, stage) => {
      pick.current = buildMemoryScene(T, stage, sim);
    },
  );
  const st = snapshot.state;
  const first = st.sector * 4;
  const open = st.open.has(st.sector);
  const [title, text] = caption(st.sector, open, st.handshake ? st.anim : null);
  const ready = status === "ready";

  function choose(sector: number) {
    sim.update((s) => {
      s.sector = sector;
      s.handshake = false;
    });
  }

  // Without WebGL there is no key to watch: the sector simply opens.
  function authenticate() {
    sim.update((s) => {
      if (ready) s.anim = { s: s.sector, t0: performance.now() / 1000 };
      else s.open = new Set([...s.open, s.sector]);
    });
  }

  function onCanvasClick(e: MouseEvent<HTMLCanvasElement>) {
    if (!stageRef.current?.wasClick()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const hit = pick.current?.(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    if (hit !== null && hit !== undefined) choose(hit);
  }

  return (
    <div className={styles.f3d}>
      <StageBox
        boxRef={boxRef}
        canvasRef={canvasRef}
        labelsRef={labelsRef}
        status={status}
        label="3D view: the card's 16 sectors as cabinets of 4 blocks each, the top block of each being the sector trailer with a lock. Click a sector to open it."
        fallback="The byte table below still works."
        onClick={onCanvasClick}
      />
      <ButtonRow>
        <Button
          pressed={st.after}
          onClick={() =>
            sim.update((s) => {
              s.after = !s.after;
              s.blocks = exampleCard(s.after);
            })
          }
        >
          After R5
        </Button>
        <select
          className={styles.select}
          aria-label="Sector"
          value={st.sector}
          onChange={(e) => choose(Number(e.target.value))}
        >
          {Array.from({ length: 16 }, (_, s) => (
            <option key={s} value={s}>
              sector {s}
            </option>
          ))}
        </select>
        <Button disabled={status === "loading" || st.anim !== null} onClick={authenticate}>
          🔑 Authenticate this sector
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
      </ButtonRow>
      <p className={styles.legend}>
        {Object.entries(KIND_TOKEN).map(([kind, token]) => (
          <span key={kind}>
            <i style={swatch(token)} />
            {kind}
          </span>
        ))}
      </p>
      <StepCaption title={title} text={text} token={open ? "--rfid" : "--danger"} />
      <div className={panels.memScroll}>
        <div className={panels.memSide}>
          {[0, 1, 2, 3].map((k) => {
            const i = first + k;
            const b = st.blocks[i] ?? [];
            const kind = blockKind(b, i);
            return (
              <div key={i} className={panels.memRow}>
                <b>{i}</b>
                <div className={panels.memBytes}>
                  {b.map((x, j) =>
                    open ? (
                      <i key={j} className={panels[byteRole(b, j, kind)] ?? ""} title={`byte ${j}`}>
                        {hx(x)}
                      </i>
                    ) : (
                      <i key={j}>··</i>
                    ),
                  )}
                </div>
              </div>
            );
          })}
          {open ? (
            <p className={styles.legend}>
              {OPEN_LEGEND.map(([token, label]) => (
                <span key={label}>
                  <i style={swatch(token)} />
                  {label}
                </span>
              ))}
            </p>
          ) : (
            <Caption>
              Locked: every sector has its own keys, so opening sector 1 doesn't open sector 2.
            </Caption>
          )}
        </div>
      </div>
    </div>
  );
}
