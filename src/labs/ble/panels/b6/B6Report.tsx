import { type FormEvent, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import type { Layout } from "../../protocol/keyboard-layout";
import styles from "../panels.module.css";
import { SvgPainter } from "../svg";
import { drawReport } from "./draw-report";
import { KeyTrip, TRIP_MS } from "./key-trip";

const asLayout = (v: string): Layout => (v === "de" ? "de" : "us");

/** B6: a key press, from the board's layout to the computer's. */
export function B6Report(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [board, setBoard] = useState<Layout>("us");
  const [host, setHost] = useState<Layout>("de");
  const [text, setText] = useState("yes");
  const [skipped, setSkipped] = useState("");
  const [trip] = useState(() => new KeyTrip());
  const svgRef = useRef<SVGSVGElement>(null);
  const started = useRef(false);

  function type(value: string, b: Layout, h: Layout) {
    setSkipped(trip.retype(value, b, h, performance.now()));
  }

  useFrameLoop(svgRef, ({ now }) => {
    const svg = svgRef.current;
    if (!svg) return;
    // The first frame types the example, like the guide did on load.
    if (!started.current) {
      started.current = true;
      trip.retype(text, board, host, now);
    }
    const k = trip.progress(now, reduce ? 1 : TRIP_MS);
    drawReport(new SvgPainter(svg), trip, k, text, now);
    if (trip.cur && k >= 1) trip.land(now);
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    type(text, board, host);
  };
  const mismatch = board !== host;

  return (
    <div className={styles.wd}>
      <div className={styles.ctl} role="group" aria-label="Layouts">
        <label>
          board&apos;s <code>layout</code>
          <select
            className={styles.select}
            aria-label="Board layout"
            value={board}
            onChange={(e) => {
              const b = asLayout(e.target.value);
              setBoard(b);
              type(text, b, host);
            }}
          >
            <option value="us">us</option>
            <option value="de">de</option>
          </select>
        </label>
        <label>
          computer set to
          <select
            className={styles.select}
            aria-label="Computer layout"
            value={host}
            onChange={(e) => {
              const h = asLayout(e.target.value);
              setHost(h);
              type(text, board, h);
            }}
          >
            <option value="us">US</option>
            <option value="de">German</option>
          </select>
        </label>
      </div>
      <form onSubmit={submit}>
        <ButtonRow>
          <input
            className={styles.textInput}
            style={{ flex: 1 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Text to type"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit">type</Button>
          <Button onClick={() => trip.clear()}>clear</Button>
        </ButtonRow>
      </form>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 250"
          className={styles.full}
          role="img"
          aria-label="A key press travelling from the board's character table, as an 8-byte report, to the computer's layout table"
        />
      </div>
      <Caption live>
        {mismatch
          ? `The board looks characters up in its ${board.toUpperCase()} table but the computer reads key numbers with ${host === "us" ? "US" : "German"}: y and z swap, punctuation lands elsewhere. Fix: layout ${host}.`
          : `Both sides agree, so every character survives the trip.${skipped ? ` Skipped (needs AltGr/Option): ${skipped}` : ""}`}
      </Caption>
    </div>
  );
}
