import { type ReactNode, useId, useState } from "react";
import { Button, ButtonRow } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { hxs, parseHexBytes, RF } from "../protocol/bytes";
import {
  heardBit,
  isSilent,
  walkModel,
  walkSteps,
  type WalkModel,
} from "../protocol/anticollision";
import styles from "./panels.module.css";
import { StepCaption } from "./StepCaption";
import { useStepper } from "./use-stepper";

const CELL_CLASS = {
  got: styles.got,
  coll: styles.coll,
  sent: styles.sent,
  pick: styles.pick,
  "": "",
} as const;
const randomUid = () => hxs(Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)));

function Cell({ kind, text, i }: { kind: keyof typeof CELL_CLASS; text: string; i: number }) {
  return <i className={`${CELL_CLASS[kind]} ${i % 8 === 0 && i ? styles.byte : ""}`}>{text}</i>;
}

function BitRow({
  name,
  silent,
  children,
}: {
  name: string;
  silent?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.acRow} ${silent ? styles.silent : ""}`}>
      <span className={styles.acName}>{name}</span>
      <div className={styles.acBits}>{children}</div>
    </div>
  );
}

/** The binary tree the walk follows: shared bits, then a branch at the first collision. */
function WalkTree({ m, step }: { m: WalkModel; step: number }) {
  const p = m.p;
  const yTop = 18;
  const yFork = 70;
  const leafY = 128;
  const one = m.winner;
  const zero = m.winner === "A" ? "B" : "A";
  const onPath1 = step >= 2 && step <= 4;
  const onPath0 = step >= 5;
  return (
    <div className={styles.treeScroll}>
      <svg
        className={styles.tree}
        viewBox="0 0 680 150"
        role="img"
        aria-label="The binary tree the walk follows: shared bits, then a branch at the first collision."
      >
        {p ? (
          <>
            <line
              x1={340}
              y1={yTop}
              x2={340}
              y2={yFork}
              className={`${styles.edge} ${step >= 1 ? styles.on : ""}`}
            />
            <text
              x={350}
              y={(yTop + yFork) / 2 + 4}
              className={styles.tk}
            >{`bits 1–${p - 1}: shared (${p - 1} bits)`}</text>
            <path
              d={`M340 ${yFork} Q 260 ${yFork + 10} 200 ${leafY - 14}`}
              className={`${styles.edge} ${onPath0 ? styles.on : ""}`}
            />
            <path
              d={`M340 ${yFork} Q 420 ${yFork + 10} 480 ${leafY - 14}`}
              className={`${styles.edge} ${onPath1 ? styles.on : ""}`}
            />
            <circle cx={340} cy={yFork} r={7} className={styles.node} />
            <text x={352} y={yFork + 4} className={styles.tk}>{`bit ${p}: collision`}</text>
            <text x={236} y={yFork + 6} className={styles.tk} textAnchor="end">
              bit = 0
            </text>
            <text x={444} y={yFork + 6} className={styles.tk}>
              bit = 1, taken first
            </text>
            <text
              x={200}
              y={leafY + 4}
              className={styles.leaf}
              textAnchor="middle"
            >{`card ${zero}${onPath0 && step === 6 ? " ✓ found second" : ""}`}</text>
            <text
              x={480}
              y={leafY + 4}
              className={styles.leaf}
              textAnchor="middle"
            >{`card ${one}${step >= 4 ? " ✓ found first" : ""}`}</text>
          </>
        ) : null}
      </svg>
    </div>
  );
}

/** R3 panel: anticollision as a walk down the UID bits of two cards. */
export function RfidAnticoll(_: WidgetProps) {
  const [textA, setTextA] = useState(hxs(RF.card.uid));
  const [textB, setTextB] = useState(hxs(RF.tag.uid));
  const ids = useId();
  const m = walkModel(
    parseHexBytes(textA, 4) ?? RF.card.uid,
    parseHexBytes(textB, 4) ?? RF.tag.uid,
  );
  const list = walkSteps(m);
  const { step, playing, togglePlay, back, next, jump } = useStepper(list.length, 3200);
  const s = list[step] ?? list[0];
  const bitsRow = (bits: readonly number[]) =>
    bits.map((x, i) => (
      <Cell key={i} kind={i === m.p - 1 && step >= 1 ? "coll" : ""} text={String(x)} i={i} />
    ));
  const edit = (set: (v: string) => void) => (v: string) => {
    set(v);
    jump((st) => Math.max(st, 1));
  };

  return (
    <div className={styles.wd}>
      <div className={styles.inputs}>
        <label htmlFor={`${ids}a`}>
          Card A UID
          <input
            id={`${ids}a`}
            className={styles.field}
            value={textA}
            onChange={(e) => edit(setTextA)(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            aria-label="Card A UID, 4 bytes in hex"
          />
        </label>
        <label htmlFor={`${ids}b`}>
          Card B UID
          <input
            id={`${ids}b`}
            className={styles.field}
            value={textB}
            onChange={(e) => edit(setTextB)(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            aria-label="Card B UID, 4 bytes in hex"
          />
        </label>
        <Button
          onClick={() => {
            setTextA(randomUid());
            setTextB(randomUid());
            jump(1);
          }}
        >
          Random pair
        </Button>
        <span className={styles.count}>{`step ${step + 1} / ${list.length}`}</span>
      </div>
      <ButtonRow aria-label="Playback">
        <Button onClick={back}>◀ Back</Button>
        <Button onClick={togglePlay}>{playing ? "❚❚ Pause" : "▶ Play"}</Button>
        <Button onClick={next}>Next ▶</Button>
      </ButtonRow>
      <div
        className={styles.grid}
        role="img"
        aria-label="The UID bits of both cards and what the reader hears, in the order they travel."
      >
        <BitRow name={`card A ${hxs(m.a)}`} silent={isSilent(m, step, "A")}>
          {bitsRow(m.A)}
        </BitRow>
        <BitRow name={`card B ${hxs(m.b)}`} silent={isSilent(m, step, "B")}>
          {bitsRow(m.B)}
        </BitRow>
        <BitRow name="reader hears">
          {Array.from({ length: 32 }, (_, i) => {
            const h = heardBit(m, step, i);
            return <Cell key={i} kind={h ? h[0] : ""} text={h ? h[1] : "·"} i={i} />;
          })}
        </BitRow>
        <BitRow name="bit #">
          {Array.from({ length: 32 }, (_, i) => (
            <Cell
              key={i}
              kind=""
              text={(i + 1) % 8 === 1 || i + 1 === m.p ? String(i + 1) : ""}
              i={i}
            />
          ))}
        </BitRow>
      </div>
      <WalkTree m={m} step={step} />
      {s ? <StepCaption title={s.t} text={s.x} /> : null}
    </div>
  );
}
