import { useEffect, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { context2d } from "@/lib/canvas";
import { useReducedMotion } from "@/lib/media";
import { ScopeCaption } from "./parts";
import {
  analyzerPalette,
  drawAnalyzer,
  MS_PER_SLOT,
  SLOTS,
  slotCaption,
  STILL_SLOT,
} from "./spi-analyzer";
import styles from "./wiring.module.css";

/** Lesson 03 "Signals": a logic analyzer replaying one SPI transfer, bit by bit. */
export function LogicAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const t0 = useRef(0);
  const [slot, setSlot] = useState(STILL_SLOT);

  useEffect(() => {
    t0.current = performance.now();
  }, []);

  useFrameLoop(canvasRef, ({ now }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = reduce ? STILL_SLOT : ((now - t0.current) / MS_PER_SLOT) % SLOTS.length;
    drawAnalyzer(context2d(canvas), analyzerPalette(), pos);
    setSlot(Math.min(SLOTS.length - 1, Math.floor(pos)));
  });

  return (
    <div className={styles.la}>
      <canvas
        ref={canvasRef}
        width="680"
        height="200"
        role="img"
        aria-label="Logic analyzer view of one SPI transfer"
      />
      <ScopeCaption lines={slotCaption(SLOTS[slot])} />
    </div>
  );
}
