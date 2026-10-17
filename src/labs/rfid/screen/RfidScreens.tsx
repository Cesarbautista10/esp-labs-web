import { useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d, SCREEN_H, SCREEN_W, scopePalette } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { Caption } from "@/ui/Caption";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { ScreenFrame } from "@/ui/ScreenFrame";
import type { WidgetProps } from "@/widgets/types";
import { drawRfidScreen, RFID_VIEWS } from "./rfid-screen";
import { exampleScreen, SCREEN_DOCS } from "./screen-docs";
import styles from "./screen.module.css";

/** R1-R6 panel: every view of the board's screen, with numbered marks explained below it. */
export function RfidScreens({ panel }: WidgetProps) {
  const [view, setView] = useState(Math.min(panel?.view ?? 0, RFID_VIEWS.length - 1));
  const [hl, setHl] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const doc = SCREEN_DOCS[view] ?? SCREEN_DOCS[0];

  useFrameLoop(canvasRef, ({ now }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawRfidScreen(context2d(canvas), scopePalette(), exampleScreen(view), now / 1000, reduce);
  });

  if (!doc) return null;
  return (
    <div className={styles.gallery}>
      <ChoiceGroup
        label="Screen view"
        value={view}
        onChange={(v) => {
          setView(v);
          setHl(-1);
        }}
        choices={RFID_VIEWS.map((v, i) => ({ key: i, label: `${i + 1} · ${v}` }))}
      />
      <ScreenFrame>
        <div className={styles.scr}>
          <canvas
            ref={canvasRef}
            width={SCREEN_W}
            height={SCREEN_H}
            role="img"
            aria-label={`Example of the ${RFID_VIEWS[view]} view. The list below explains each numbered part.`}
          />
          <div className={styles.marks} aria-hidden="true">
            {doc.parts.map(([x, y], i) => (
              <span
                key={i}
                className={i === hl ? styles.hl : undefined}
                style={{ left: `${(x / SCREEN_W) * 100}%`, top: `${(y / SCREEN_H) * 100}%` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </ScreenFrame>
      <Caption live>{doc.when}</Caption>
      <ol className={styles.list}>
        {doc.parts.map(([, , text], i) => (
          // Focusable so keyboard users can light up the matching mark on the screen.
          <li
            key={`${view}-${i}`}
            // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- focusable so keyboard users can reach it
            tabIndex={0}
            className={i === hl ? styles.hl : undefined}
            onMouseEnter={() => setHl(i)}
            onMouseLeave={() => setHl(-1)}
            onFocus={() => setHl(i)}
            onBlur={() => setHl(-1)}
          >
            {text}
          </li>
        ))}
      </ol>
    </div>
  );
}
