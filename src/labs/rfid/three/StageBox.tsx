import type { MouseEventHandler, RefObject } from "react";
import styles from "./f3d.module.css";
import type { StageStatus } from "./use-stage";

interface StageBoxProps {
  boxRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  labelsRef: RefObject<HTMLDivElement | null>;
  status: StageStatus;
  label: string;
  /** What still works when three.js can't run. */
  fallback: string;
  onClick?: MouseEventHandler<HTMLCanvasElement>;
}

/** The 3D stage's box: canvas, the labels that follow 3D points, the drag hint and load state. */
export function StageBox({
  boxRef,
  canvasRef,
  labelsRef,
  status,
  label,
  fallback,
  onClick,
}: StageBoxProps) {
  return (
    <div ref={boxRef} className={styles.stage}>
      {/* Clicks pick a part of the model; every pick also has a button or menu outside the canvas. */}
      <canvas ref={canvasRef} role="img" aria-label={label} onClick={onClick} />
      {/* Labels are positioned by the stage every frame; React leaves this box empty. */}
      <div ref={labelsRef} className={styles.labels} aria-hidden="true" />
      <p className={styles.hint} aria-hidden="true">
        drag to turn
      </p>
      {status !== "ready" ? (
        <p className={styles.load} role="status">
          {status === "loading"
            ? "Loading the 3D view…"
            : `The 3D view couldn't start in this browser (it needs WebGL). ${fallback}`}
        </p>
      ) : null}
    </div>
  );
}
