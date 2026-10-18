import { useEffect, useRef } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d, SCREEN_H, SCREEN_W, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { ScreenFrame } from "@/ui/ScreenFrame";
import { Terminal, useTerminalLog } from "@/ui/terminal/Terminal";
import type { WidgetProps } from "@/widgets/types";
import { useSimulation } from "../shared/simulation";
import { type LogLine, printLog } from "./log";
import { type Press, PushButton } from "@/ui/board-button/BoardButton";
import { drawWeather, weatherPalette } from "./weather-draw";
import {
  askOracle,
  BOOT_LINES,
  HAIKU,
  initWeather,
  ORACLE_VIEW,
  oracleAnswered,
  refreshWeather,
  setWeatherView,
  UMBRELLA,
  WEATHER_VIEWS,
} from "./weather-model";
import styles from "./wifi.module.css";

const VIEW_CHOICES = WEATHER_VIEWS.map((v, i) => ({ key: i, label: `${i + 1} ${v}` }));
const ANSWER_MS = 2400;

/** W3 preview: weather views and the Bench Oracle, with example data. */
export function WeatherPreview(_: WidgetProps) {
  const term = useTerminalLog();
  const [sim, snapshot] = useSimulation(initWeather);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const answerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduce = useReducedMotion();

  const print = (lines: readonly LogLine[]) => printLog(term, lines);

  useEffect(() => {
    printLog(term, BOOT_LINES);
    printLog(term, setWeatherView(sim.state, 0));
    return () => {
      clearTimeout(answerTimer.current);
      term.clear();
    };
  }, [sim, term]);

  useFrameLoop(canvasRef, ({ now }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = sim.state;
    // Reduced motion freezes the sky; a question being answered still animates and types out.
    const still = reduce && !st.asking && st.answer === null;
    drawWeather(
      context2d(canvas),
      weatherPalette(scopePalette()),
      st,
      still ? 1.2 : now / 1000,
      now,
    );
  });

  function ask(i: number, via?: string) {
    sim.update((st) => {
      const lines = askOracle(st, i, performance.now(), via);
      if (!lines) return;
      print(lines);
      answerTimer.current = setTimeout(
        () => sim.update((s) => print(oracleAnswered(s, i, performance.now()))),
        reduce ? 50 : ANSWER_MS,
      );
    });
  }

  function onPress(press: Press) {
    if (press === "double" && sim.state.view === ORACLE_VIEW) return ask(HAIKU);
    sim.update((st) =>
      print(press === "double" ? refreshWeather(st) : setWeatherView(st, st.view + 1)),
    );
  }

  return (
    <div className={styles.sim}>
      <ScreenFrame>
        <canvas
          ref={canvasRef}
          width={SCREEN_W}
          height={SCREEN_H}
          role="img"
          aria-label="Simulated weather and oracle screen, example data"
        />
      </ScreenFrame>
      <div className={styles.bootRow}>
        <PushButton
          label="BUTTON"
          aria-label="Push button: click next view, double-click refresh or new haiku"
          doubleMs={320}
          onPress={onPress}
        />
        <ChoiceGroup
          label="Views"
          choices={VIEW_CHOICES}
          value={snapshot.state.view}
          onChange={(i) => sim.update((st) => print(setWeatherView(st, i, `view ${i + 1}`)))}
        />
        <Button onClick={() => ask(UMBRELLA, "ask should I take an umbrella?")}>
          ask: umbrella? (example)
        </Button>
      </div>
      <Caption>
        Example city, weather and oracle answers, not live. Click = next view, double-click =
        refresh (oracle view: a new haiku). Your board shows your city and real answers from the
        model you pick.
      </Caption>
      <Terminal log={term} title="$ uv run pio device monitor   (expected output, example data)" />
    </div>
  );
}
