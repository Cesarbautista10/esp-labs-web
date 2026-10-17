import { useEffect, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import styles from "../panels.module.css";
import { SvgPainter } from "../svg";
import { drawSound, MediaScene, type MediaKey, USAGE } from "./draw-sound";

const KEYS: readonly [MediaKey, string][] = [
  ["play", "play/pause"],
  ["next", "next track"],
  ["down", "volume −"],
  ["up", "volume +"],
];

const DIRECT =
  "The S3's radio speaks only Bluetooth LE. Speaker audio uses Classic Bluetooth (BR/EDR), another modulation and protocol, so the board can't even see the JBL's audio side. The original ESP32 has Classic and can stream (A2DP); newer speakers with LE Audio/Auracast need Bluetooth 5.2, the S3 has 5.0.";

/** B6: board → phone (BLE HID) → speaker (Classic A2DP), and why board → speaker fails. */
export function B6Sound(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [scene] = useState(() => new MediaScene());
  const [cap, setCap] = useState("Press a media key.");
  const svgRef = useRef<SVGSVGElement>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useFrameLoop(svgRef, ({ now }) => {
    if (svgRef.current) drawSound(new SvgPainter(svgRef.current), scene, now, reduce);
  });

  function press(key: MediaKey) {
    scene.press(key);
    // The phone reacts once the report has arrived.
    const id = setTimeout(
      () => {
        timers.current.delete(id);
        scene.apply(key);
      },
      reduce ? 0 : 640,
    );
    timers.current.add(id);
    setCap(
      `The board sends one tiny HID report (usage ${USAGE[key]}) and a release. The phone does the rest: it changes its own music, and its audio stream to the speaker follows.`,
    );
  }

  return (
    <div className={styles.wd}>
      <ButtonRow role="group" aria-label="Media keys">
        {KEYS.map(([k, label]) => (
          <Button key={k} onClick={() => press(k)}>
            {label}
          </Button>
        ))}
        <Button
          onClick={() => {
            scene.press("direct");
            setCap(DIRECT);
          }}
        >
          board → speaker directly?
        </Button>
      </ButtonRow>
      <div className={styles.scroll}>
        <svg
          ref={svgRef}
          viewBox="0 0 680 230"
          className={styles.full}
          role="img"
          aria-label="The board sends a media key to the phone over Bluetooth LE; the phone streams audio to the speaker over Classic Bluetooth"
        />
      </div>
      <Caption live>{cap}</Caption>
    </div>
  );
}
