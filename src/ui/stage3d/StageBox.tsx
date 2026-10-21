import type { MouseEventHandler, ReactNode, RefObject } from "react";
import { Icon } from "@/ui/Icon";
import type { Stage3d } from "./stage3d";
import styles from "./StageBox.module.css";
import type { StageStatus } from "./use-stage";

interface StageBoxProps {
  boxRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  labelsRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<Stage3d | null>;
  status: StageStatus;
  label: string;
  /** What still works when three.js can't run. */
  fallback: string;
  onClick?: MouseEventHandler<HTMLCanvasElement>;
  className?: string;
  /** Class of the canvas's own frame (it holds the toolbar), for layouts that place it. */
  viewClassName?: string;
  /** Extra content inside the box, e.g. callout cards the leaders point from. */
  children?: ReactNode;
}

const STEP = Math.PI / 8;

/**
 * The 3D stage's box: canvas, the labels and leaders that follow 3D points, a small toolbar
 * (turn, zoom, recentre: the same as dragging and pinching, for keyboards and one hand) and
 * the load state.
 */
export function StageBox({
  boxRef,
  canvasRef,
  labelsRef,
  stageRef,
  status,
  label,
  fallback,
  onClick,
  className,
  viewClassName,
  children,
}: StageBoxProps) {
  return (
    <div ref={boxRef} className={`${styles.stage} ${className ?? ""}`} data-status={status}>
      <div className={`${styles.view} ${viewClassName ?? ""}`}>
        {/* Clicks pick a part of the model; every pick also has a button or menu outside it. */}
        <canvas ref={canvasRef} role="img" aria-label={label} onClick={onClick} />
        {status === "ready" ? (
          <div className={styles.tools} role="toolbar" aria-label="Turn and zoom the 3D view">
            <button
              type="button"
              onClick={() => stageRef.current?.rotate(-STEP)}
              aria-label="Turn left"
            >
              <Icon name="rotateLeft" size={16} />
            </button>
            <button
              type="button"
              onClick={() => stageRef.current?.rotate(STEP)}
              aria-label="Turn right"
            >
              <Icon name="rotateRight" size={16} />
            </button>
            <span className={styles.sep} aria-hidden="true" />
            <button
              type="button"
              onClick={() => stageRef.current?.zoom(1.18)}
              aria-label="Zoom out"
            >
              <Icon name="zoomOut" size={16} />
            </button>
            <button
              type="button"
              onClick={() => stageRef.current?.zoom(1 / 1.18)}
              aria-label="Zoom in"
            >
              <Icon name="zoomIn" size={16} />
            </button>
            <span className={styles.sep} aria-hidden="true" />
            <button
              type="button"
              onClick={() => stageRef.current?.recenter()}
              aria-label="Back to the start view"
            >
              <Icon name="recenter" size={16} />
            </button>
          </div>
        ) : null}
        <p className={styles.hint} aria-hidden="true">
          drag to turn · pinch to zoom
        </p>
        {status !== "ready" ? (
          <p className={styles.load} role="status">
            {status === "loading"
              ? "Loading the 3D view…"
              : `The 3D view couldn't start in this browser (it needs WebGL). ${fallback}`}
          </p>
        ) : null}
      </div>
      {children}
      {/* Labels and leaders are positioned by the stage every frame; React leaves this box empty. */}
      <div ref={labelsRef} className={styles.labels} aria-hidden="true" />
    </div>
  );
}
