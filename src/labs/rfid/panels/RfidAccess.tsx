import { useId, useState } from "react";
import { Button, ButtonRow } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import {
  BIT_MAP,
  bitsOf,
  type Conditions,
  DATA_RULE,
  decodeAccess,
  encodeAccess,
  locksForever,
  PRESETS,
  TRAILER_RULE,
  withCondition,
} from "../protocol/access-bits";
import { hx, hxs, parseHexBytes } from "../protocol/bytes";
import styles from "./panels.module.css";

const BYTE_NOTE = ["~C2 | ~C1", "C1 | ~C3", "C3 | C2"] as const;
const blockName = (b: number) => (b === 3 ? "the trailer" : `block ${b}`);

/** R4 panel: decode and build a sector trailer's access bits (bytes 6-8). */
export function RfidAccess(_: WidgetProps) {
  const [cond, setCond] = useState<Conditions>([0, 0, 0, 1]);
  const [text, setText] = useState("FF 07 80");
  const [inconsistent, setInconsistent] = useState(false);
  const [hl, setHl] = useState(-1);
  const inputId = useId();
  const bytes = encodeAccess(cond);

  function apply(next: Conditions) {
    setCond(next);
    setText(hxs(encodeAccess(next)));
    setInconsistent(false);
  }

  function toggle(block: number, k: number, on: boolean) {
    const bit = 4 >> k;
    const c = cond[block] ?? 0;
    apply(withCondition(cond, block, on ? c | bit : c & ~bit));
  }

  function type(value: string) {
    setText(value);
    const parsed = parseHexBytes(value, 3);
    if (!parsed) return;
    const decoded = decodeAccess([parsed[0] ?? 0, parsed[1] ?? 0, parsed[2] ?? 0]);
    if (!decoded) {
      setInconsistent(true);
      return;
    }
    setInconsistent(false);
    setCond(decoded);
  }

  const trailer = cond[3] ?? 0;
  return (
    <div className={styles.wd}>
      <ButtonRow className={styles.alignEnd}>
        {Object.entries(PRESETS).map(([name, preset]) => (
          <Button key={name} onClick={() => apply(preset)}>
            {name}
          </Button>
        ))}
        <span className={styles.inputs}>
          <label htmlFor={inputId}>
            or type bytes 6–8
            <input
              id={inputId}
              className={styles.field}
              value={text}
              onChange={(e) => type(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
        </span>
      </ButtonRow>
      <div className={styles.tableScroll}>
        <table className={styles.abTable}>
          <thead>
            <tr>
              <th>Block</th>
              <th>C1</th>
              <th>C2</th>
              <th>C3</th>
              <th>What it allows</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3].map((b) => (
              // Hovering or focusing a row lights up where its 3 bits (and their inverted copies) live.
              <tr key={b} onMouseEnter={() => setHl(b)} onFocus={() => setHl(b)}>
                <td className={styles.mono}>{b === 3 ? "trailer" : `block ${b}`}</td>
                {bitsOf(cond, b).map((v, k) => (
                  <td key={k} className={styles.c}>
                    <input
                      type="checkbox"
                      checked={v === 1}
                      onChange={(e) => toggle(b, k, e.target.checked)}
                      aria-label={`C${k + 1} of ${blockName(b)}`}
                    />
                  </td>
                ))}
                <td>{(b === 3 ? TRAILER_RULE : DATA_RULE)[cond[b] ?? 0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.abBytes}>
        {bytes.map((v, i) => (
          <div key={i} className={styles.abByte}>
            <b>byte {6 + i}</b>
            <span className={styles.hex}>{hx(v)}</span>
            <div className={styles.bits}>
              {(BIT_MAP[i] ?? []).map(([n, b, inv], k) => (
                <i
                  key={k}
                  className={`${inv ? styles.inv : ""} ${b === hl ? styles.hl : ""}`}
                  title={`${inv ? "inverted " : ""}C${n} of ${blockName(b)}`}
                >
                  {(v >> (7 - k)) & 1}
                </i>
              ))}
            </div>
            <small>{BYTE_NOTE[i]} · each half: blocks 3 2 1 0</small>
          </div>
        ))}
      </div>
      <div aria-live="polite">
        {inconsistent ? (
          <div className={styles.warnBox}>
            <b>Inconsistent:</b> the inverted copies don't match. A card refuses such a trailer, or
            locks the sector.
          </div>
        ) : locksForever(trailer) ? (
          <div className={styles.warnBox}>
            <b>Never write this to a card.</b> With trailer setting{" "}
            {trailer.toString(2).padStart(3, "0")} no key can change this sector's keys again. The
            lab's firmware never writes trailers at all.
          </div>
        ) : null}
      </div>
    </div>
  );
}
