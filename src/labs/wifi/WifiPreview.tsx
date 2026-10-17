import { useEffect, useRef } from "react";
import { context2d, SCREEN_H, SCREEN_W, scopePalette } from "@/lib/canvas";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { ScreenFrame } from "@/ui/ScreenFrame";
import { Terminal, useTerminalLog } from "@/ui/terminal/Terminal";
import type { WidgetProps } from "@/widgets/types";
import { useSimulation } from "../shared/simulation";
import type { LogLine } from "./log";
import { PushButton, type Press } from "@/ui/board-button/BoardButton";
import { drawScanner } from "./scanner-draw";
import {
  bootScanner,
  initScanner,
  joinFirst,
  SCANNER_VIEWS,
  setAuto,
  setView,
  startScan,
  stepScanner,
} from "./scanner-model";
import styles from "./wifi.module.css";

const VIEW_CHOICES = SCANNER_VIEWS.map((v, i) => ({ key: i, label: `${i + 1} ${v}` }));

/** W1 preview: the scanner's views, the push button, a join and the serial monitor (example networks). */
export function WifiPreview(_: WidgetProps) {
  const term = useTerminalLog();
  const [sim, snapshot] = useSimulation(() => initScanner());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  const print = (lines: readonly LogLine[]) =>
    lines.forEach(([text, tone]) => term.line(text, tone));

  useEffect(() => {
    print(bootScanner(sim.state, performance.now()));
    return () => term.clear();
    // Once per mounted board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, term]);

  useFrameLoop(canvasRef, ({ now }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    print(stepScanner(sim.state, now, Math.random));
    drawScanner(context2d(canvas), scopePalette(), sim.state, now, reduce);
  });

  function onPress(press: Press) {
    const now = performance.now();
    sim.update((st) => {
      if (press === "hold") print(setAuto(st, !st.auto));
      else if (press === "double") print(startScan(st, "button", now));
      else print(setView(st, st.view + 1, now));
    });
  }

  const { state } = snapshot;

  return (
    <div className={styles.sim}>
      <ScreenFrame>
        <canvas
          ref={canvasRef}
          width={SCREEN_W}
          height={SCREEN_H}
          role="img"
          aria-label="Simulated scanner screen"
        />
      </ScreenFrame>
      <div className={styles.bootRow}>
        <PushButton
          label="BUTTON"
          aria-label="Push button: click next view, double-click scan, hold auto-scan"
          doubleMs={280}
          holdMs={600}
          onPress={onPress}
        />
        <ChoiceGroup
          label="Views"
          choices={VIEW_CHOICES}
          value={state.view}
          onChange={(i) =>
            sim.update((st) => print(setView(st, i, performance.now(), `view ${i + 1}`)))
          }
        />
        <Button onClick={() => sim.update((st) => print(joinFirst(st, performance.now())))}>
          join 1 (example)
        </Button>
        <span className={styles.autoFlag}>auto-scan {state.auto ? "on · every 10 s" : "off"}</span>
      </div>
      <Caption>
        Example networks and addresses, not yours. Click = next view, double-click = scan now, hold
        0.6 s = auto-scan on/off. “join 1 (example)” shows what joining looks like. Your board shows
        the real networks around you.
      </Caption>
      <Terminal
        log={term}
        title="$ uv run pio device monitor   (expected output, example networks)"
      />
    </div>
  );
}
