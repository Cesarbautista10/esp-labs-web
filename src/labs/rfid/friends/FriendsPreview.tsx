import { useEffect, useRef, useState } from "react";
import { useBoardRgb } from "@/features/board/board-signals";
import { useFrameLoop } from "@/lib/animation";
import { context2d, SCREEN_H, SCREEN_W, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import { ScreenFrame } from "@/ui/ScreenFrame";
import { Terminal, useTerminalLog } from "@/ui/terminal/Terminal";
import type { WidgetProps } from "@/widgets/types";
import { useSimulation } from "../../shared/simulation";
import { useTimers } from "../lab/use-timers";
import { FRIEND_CAST } from "./cast";
import {
  announce,
  drawFriendsScreen,
  type FriendCard,
  FRIENDS_VIEWS,
  initialFriends,
  showColor,
  tapCard,
} from "./friends-sim";
import styles from "./friends.module.css";

const LED_MS = 1500;

/** R8 preview: the friends screen, taps, moving a friend in from the app, and the serial monitor. */
export function FriendsPreview(_: WidgetProps) {
  const term = useTerminalLog();
  const after = useTimers();
  const [sim, snapshot] = useSimulation(initialFriends);
  const [who, setWho] = useState(FRIEND_CAST[0]?.id ?? "fox");
  const [cardNo, setCardNo] = useState(1);
  const setRgb = useBoardRgb();
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    term.line(
      "[I][main.cpp] setup(): rfid-lab-r8: reader task on core 0. Type token for the app's .env, help for commands.",
      "info",
    );
    term.line("[I][friends.h] begin(): friend list: 2 cards");
    term.line(
      "[I][main.cpp] loop(): App: http://bench.local or http://192.168.178.57  (set BENCH_URL in friends-app/.env)",
    );
    return () => term.clear();
  }, [term]);

  useFrameLoop(canvasRef, ({ now }) => {
    const canvas = canvasRef.current;
    if (canvas) drawFriendsScreen(context2d(canvas), scopePalette(), sim.state, now, reduce);
  });

  /** The LED flashes in the friend's colour, then goes dark. */
  function flash(c: FriendCard) {
    setRgb({ color: showColor(c) });
    after(LED_MS, () => setRgb(null));
  }

  function tap(which: number | "new") {
    sim.update((st) => {
      const [line, tone] = tapCard(st, which, performance.now(), () =>
        Math.floor(Math.random() * 256),
      );
      term.line(line, tone);
      if (tone !== "warn" && st.show) flash(st.show);
    });
  }

  function give() {
    sim.update((st) => {
      const c = st.cards.find((x) => x.number === cardNo);
      if (!c) return;
      c.character = who;
      term.line(`[I][friends_api.h] PUT /api/card?uid=${c.uid} {"character":"${who}"} -> 200`);
      const [line, tone] = announce(st, c, false, true, performance.now());
      term.line(line, tone);
      flash(c);
    });
  }

  const st = snapshot.state;
  return (
    <div className={styles.sim}>
      <ButtonRow aria-label="Taps">
        <Button onClick={() => tap(0)}>tap: White card</Button>
        <Button onClick={() => tap(1)}>tap: Key tag</Button>
        <Button onClick={() => tap("new")}>tap: a new card</Button>
      </ButtonRow>
      <ButtonRow aria-label="The app and the push button">
        <span className={styles.move}>
          app: move
          <select aria-label="Which friend" value={who} onChange={(e) => setWho(e.target.value)}>
            {FRIEND_CAST.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          onto card
          <select
            aria-label="Which card"
            value={cardNo}
            onChange={(e) => setCardNo(Number(e.target.value))}
          >
            {st.cards.map((c) => (
              <option key={c.number} value={c.number}>
                {c.number}
              </option>
            ))}
          </select>
        </span>
        <Button onClick={give}>move in</Button>
        <Button onClick={() => sim.update((s) => (s.view = (s.view + 1) % FRIENDS_VIEWS.length))}>
          button: next view
        </Button>
      </ButtonRow>
      <ScreenFrame>
        <canvas
          ref={canvasRef}
          width={SCREEN_W}
          height={SCREEN_H}
          role="img"
          aria-label={`Simulated friends screen: ${FRIENDS_VIEWS[st.view]} view`}
        />
      </ScreenFrame>
      <Caption>
        Example data. The board draws the same shapes (characters.h); the app shows them in 3D.
      </Caption>
      <Terminal log={term} title="$ uv run pio device monitor" />
    </div>
  );
}
