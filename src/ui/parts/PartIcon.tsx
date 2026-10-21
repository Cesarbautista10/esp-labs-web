import type { ReactNode } from "react";
import { PARTS, type PartName } from "./registry";
import styles from "./parts.module.css";

/**
 * A part from the library: a small isometric illustration in the design's colours. Decorative
 * unless given a label; `label` true uses the part's own name.
 */
export function PartIcon({
  name,
  size = 64,
  label,
  className,
}: {
  name: PartName;
  size?: number;
  label?: string | true;
  className?: string;
}) {
  const part: { draw: () => ReactNode; label: string; scale?: number } = PARTS[name];
  const { draw: Draw, label: own, scale = 1 } = part;
  const name_ = label === true ? own : label;
  return (
    <svg
      className={`${styles.icon} ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={name_ ? "img" : undefined}
      aria-label={name_}
      aria-hidden={name_ ? undefined : true}
      focusable="false"
    >
      <g
        transform={scale === 1 ? undefined : `translate(32 38) scale(${scale}) translate(-32 -38)`}
      >
        <Draw />
      </g>
    </svg>
  );
}
