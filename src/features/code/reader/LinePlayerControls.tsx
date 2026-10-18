import type { Rich } from "@/domain/lesson";
import { RichText } from "@/ui/RichText";
import panel from "../panels.module.css";
import type { LinePlayer } from "./use-line-player";

/** "Line by line": play, pause, step, and what the current line does. */
export function LinePlayerControls({
  player,
  explanation,
}: {
  player: LinePlayer;
  explanation: Rich | null;
}) {
  if (player.count === 0) return null;
  return (
    <div className={panel.player}>
      {player.cursor === null ? (
        <button type="button" className={panel.play} onClick={player.play}>
          <span aria-hidden="true">▶</span> Line by line
          {player.count > 1 ? ` (${player.count})` : ""}
        </button>
      ) : (
        <>
          <div className={panel.playerBar} role="group" aria-label="Line by line">
            <button type="button" onClick={() => player.step(-1)} aria-label="Previous line">
              ↑
            </button>
            <button type="button" onClick={player.playing ? player.pause : player.play}>
              {player.playing ? "❚❚ Pause" : "▶ Play"}
            </button>
            <button type="button" onClick={() => player.step(1)} aria-label="Next line">
              ↓
            </button>
            <span className={panel.lineNo}>line {player.cursor + 1}</span>
          </div>
          {explanation ? (
            <p className={panel.lineSay} aria-live="polite" key={player.cursor}>
              <RichText text={explanation} />
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
