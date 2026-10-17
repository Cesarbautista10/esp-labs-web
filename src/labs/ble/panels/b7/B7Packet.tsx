import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { type MidiByte, midiPacket, type PendingNote } from "../../protocol/midi";
import styles from "../panels.module.css";
import { SvgPainter } from "../svg";
import { Beeper } from "./beeper";
import { drawPacket } from "./draw-packet";
import own from "./B7Packet.module.css";

const KEYS: readonly (readonly [name: string, note: number, key: string])[] = [
  ["C", 60, "a"],
  ["D", 62, "s"],
  ["E", 64, "d"],
  ["F", 65, "f"],
  ["G", 67, "g"],
  ["A", 69, "h"],
  ["B", 71, "j"],
  ["C", 72, "k"],
];

/** B7: BLE-MIDI packet anatomy, built live from a mini keyboard. */
export function B7Packet(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(true);
  const [collect, setCollect] = useState(15);
  const [sound, setSound] = useState(false);
  const [packet, setPacket] = useState<MidiByte[] | null>(null);
  const [cap, setCap] = useState("Play a note.");
  const [beeper] = useState(() => new Beeper());
  const svgRef = useRef<SVGSVGElement>(null);
  const pending = useRef<PendingNote[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const t0 = useRef(0);
  const rsId = useId();
  const soundId = useId();

  useEffect(() => {
    t0.current = performance.now();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      beeper.close();
    };
  }, [beeper]);

  // Notes pressed within one connection event share one packet.
  function build() {
    timer.current = null;
    const msgs = pending.current.splice(0);
    const bytes = midiPacket(msgs, running);
    setPacket(bytes);
    shownAt.current = performance.now();
    const real = bytes.filter((x) => x.b !== null).length;
    const n = msgs.length;
    setCap(
      `${n} note${n > 1 ? "s" : ""} in one packet, ${real} bytes${running && n > 1 ? `: running status saved ${n - 1}` : ""}. Each note keeps its own timestamp, so the synth can space them as you played them. A note off goes out 300 ms later the same way (status 80).`,
    );
  }

  function press(note: number) {
    pending.current.push({ note, ts: Math.round(performance.now() - t0.current) & 0x1fff });
    if (sound) beeper.beep(note);
    timer.current ??= setTimeout(build, collect);
  }

  // The computer's keys A to K play too, unless you are typing somewhere.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || (e.target instanceof Element && e.target.closest("input,select,textarea")))
      return;
    const hit = KEYS.find(([, , k]) => k === e.key.toLowerCase());
    if (hit) press(hit[1]);
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    addEventListener("keydown", listener);
    return () => removeEventListener("keydown", listener);
  }, []);

  useFrameLoop(svgRef, ({ now }) => {
    if (!svgRef.current) return;
    drawPacket(
      new SvgPainter(svgRef.current),
      packet,
      reduce ? 1 : Math.min(1, (now - shownAt.current) / 900),
    );
  });

  return (
    <div className={styles.wd}>
      <div className={styles.ctl} role="group" aria-label="Packet options">
        <label htmlFor={rsId}>
          <input
            id={rsId}
            type="checkbox"
            checked={running}
            onChange={(e) => setRunning(e.target.checked)}
          />{" "}
          running status
        </label>
        <label>
          collect for
          <select
            className={styles.select}
            aria-label="Connection interval"
            value={collect}
            onChange={(e) => setCollect(Number(e.target.value))}
          >
            <option value={15}>15 ms</option>
            <option value={60}>60 ms</option>
            <option value={300}>300 ms (slow, to see batching)</option>
          </select>
        </label>
        <label htmlFor={soundId}>
          <input
            id={soundId}
            type="checkbox"
            checked={sound}
            onChange={(e) => setSound(e.target.checked)}
          />{" "}
          hear it
        </label>
      </div>
      <ButtonRow role="group" aria-label="Mini keyboard">
        {KEYS.map(([name, note, key]) => (
          <Button
            key={note}
            className={own.key}
            aria-label={`${name} (key ${key})`}
            onPointerDown={() => press(note)}
            // Keyboard activation (Enter/Space) arrives as a click without a pointer.
            onClick={(e) => {
              if (e.detail === 0) press(note);
            }}
          >
            {name}
            <small className={own.hint}> {key}</small>
          </Button>
        ))}
      </ButtonRow>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 210"
          className={styles.full}
          role="img"
          aria-label="The bytes of the last BLE-MIDI packet, coloured by role"
        />
      </div>
      <Caption live>{cap}</Caption>
    </div>
  );
}
