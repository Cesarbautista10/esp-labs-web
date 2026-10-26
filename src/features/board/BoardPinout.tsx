import { useTranslation } from "react-i18next";
import { useLocaleInfo } from "@/i18n/use-locale";
import {
  classifyPin,
  HEADER,
  onHeader,
  pinIndex,
  pinLabel,
  type PinClass,
} from "@/domain/board";
import type { PinSide, PinUse } from "@/domain/lesson";
import { useRgbState } from "./board-signals";
import { roleFill } from "./pin-colour";
import styles from "./BoardPinout.module.css";

// Geometry of the PULSAR C6 drawing (viewBox 440×520): board body, pin rows, role tags.
const BX = 140;
const BW = 160;
const PY0 = 118;
const PSTEP = 24;
const TAG_W = 50;
const TAG_H = 18;
const LABEL_CHAR_W = 6.3; // IBM Plex Mono at 10.5px
const MID = BX + BW / 2;

const pinPos = (side: PinSide, i: number) => ({
  x: side === "L" ? BX + 12 : BX + BW - 12,
  y: PY0 + i * PSTEP,
});

const PAD_FILL: Record<PinClass, string> = {
  safe: "var(--pad)",
  avoid: "var(--danger)",
  power: "var(--power)",
  gnd: "var(--gnd)",
};

interface BoardPinoutProps {
  pins: readonly PinUse[];
  /** The COM port is in use (serial monitor). */
  usb: boolean;
  /** The BOOT button is part of the lesson. */
  boot: boolean;
}

/** The PULSAR C6 as a live pinout: pins the lesson uses are tagged with their role. */
export function BoardPinout({ pins, usb, boot }: BoardPinoutProps) {
  const shown = pins.filter(onHeader);
  const used = new Map(shown.map((u) => [`${u.side}${pinIndex(u)}`, u]));
  const { t } = useTranslation();
  const { tag } = useLocaleInfo();
  const uses = new Intl.ListFormat(tag, { type: "unit" }).format(
    shown.map((p) => t("board.pinout.use", { role: p.role, pin: p.pin })),
  );

  return (
    <svg
      className={styles.board}
      viewBox="0 0 440 520"
      // The board has a physical left and right: it never mirrors.
      direction="ltr"
      role="img"
      aria-labelledby="board-title board-desc"
    >
      <title id="board-title">{t("board.pinout.title")}</title>
      <desc id="board-desc">
        {shown.length ? t("board.pinout.uses", { uses }) : t("board.pinout.none")}
      </desc>
      <rect
        x={BX}
        y={24}
        width={BW}
        height={480}
        rx={10}
        fill="var(--pcb)"
        stroke="var(--pcb-edge)"
        strokeWidth={2}
      />

      {/* The one USB-C port: it flashes the board and carries the serial monitor */}
      <rect
        x={MID - 24}
        y={8}
        width={48}
        height={34}
        rx={8}
        fill={usb ? "var(--copper)" : "var(--silk-dim)"}
      />
      <text x={MID} y={56} textAnchor="middle" className={styles.silk}>
        USB
      </text>

      {/* BOOT and RESET buttons */}
      {(["BOOT", "RST"] as const).map((name) => {
        const x = name === "BOOT" ? BX + 40 : BX + BW - 40;
        const lit = name === "BOOT" && boot;
        return (
          <g key={name}>
            <rect x={x - 12} y={66} width={24} height={16} rx={3} fill="var(--pcb-edge)" />
            <circle cx={x} cy={74} r={lit ? 7 : 5} fill={lit ? "var(--copper)" : "var(--silk-dim)"} />
            <text x={x} y={96} textAnchor="middle" className={styles.silk}>
              {name}
            </text>
          </g>
        );
      })}

      {/* microSD slot */}
      <rect x={BX + 30} y={180} width={80} height={56} rx={4} fill="var(--pcb-edge)" />
      <text x={BX + 70} y={212} textAnchor="middle" className={styles.silk}>
        MICROSD
      </text>

      {/* The ESP32-C6 itself: no module, the flash is inside the chip */}
      <rect x={MID - 26} y={262} width={52} height={52} rx={3} fill="var(--pcb-edge)" />
      <text x={MID} y={334} textAnchor="middle" className={styles.silk}>
        ESP32-C6
      </text>
      <text x={MID} y={348} textAnchor="middle" className={styles.silk}>
        FH4
      </text>

      <RgbLed cx={BX + BW - 44} cy={384} />
      <text x={BX + BW - 44} y={406} textAnchor="middle" className={styles.silk}>
        RGB
      </text>

      {/* Qwiic connector and chip antenna at the far end */}
      <rect x={MID - 22} y={446} width={44} height={30} rx={3} fill="var(--silk-dim)" />
      <text x={MID} y={494} textAnchor="middle" className={styles.silk}>
        QWIIC
      </text>
      <rect x={BX + 22} y={474} width={26} height={12} rx={2} fill="var(--pad)" />
      <text x={BX + 35} y={466} textAnchor="middle" className={styles.silk}>
        ANT
      </text>

      {(["L", "R"] as const).map((side) =>
        HEADER[side].map((pin, i) => {
          const { x, y } = pinPos(side, i);
          const use = used.get(`${side}${i}`);
          const label = pinLabel(pin);
          const labelX = side === "L" ? BX - 8 : BX + BW + 8;
          return (
            <g key={`${side}${i}`}>
              <circle
                cx={x}
                cy={y}
                r={use ? 8 : 6}
                fill={PAD_FILL[classifyPin(pin)]}
                stroke={use ? "var(--copper)" : "var(--pcb)"}
                strokeWidth={use ? 3 : 2}
              />
              <text
                x={labelX}
                y={y + 3.5}
                textAnchor={side === "L" ? "end" : "start"}
                className={`${styles.pinLabel} ${use ? styles.used : ""}`}
              >
                {label}
              </text>
              {use ? <RoleTag side={side} y={y} label={label} use={use} /> : null}
            </g>
          );
        }),
      )}
    </svg>
  );
}

function RoleTag({
  side,
  y,
  label,
  use,
}: {
  side: PinSide;
  y: number;
  label: string;
  use: PinUse;
}) {
  const fill = roleFill(use.kind);
  const gx = side === "L" ? 8 : 440 - 8 - TAG_W;
  const labelW = label.length * LABEL_CHAR_W;
  const x1 = side === "L" ? gx + TAG_W : gx;
  const x2 = side === "L" ? BX - 8 - labelW - 6 : BX + BW + 8 + labelW + 6;
  return (
    <g>
      <rect x={gx} y={y - TAG_H / 2} width={TAG_W} height={TAG_H} rx={4} fill={fill} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={fill} strokeWidth={1.5} strokeDasharray="3 3" />
      <text x={gx + TAG_W / 2} y={y + 3.8} textAnchor="middle" className={styles.role}>
        {use.role}
      </text>
    </g>
  );
}

/** The on-board WS2812: simulators drive it through board signals. */
function RgbLed({ cx, cy }: { cx: number; cy: number }) {
  const rgb = useRgbState();
  return (
    <circle
      cx={cx}
      cy={cy}
      r={7 * (rgb?.scale ?? 1)}
      fill={rgb?.color ?? "var(--silk-dim)"}
      stroke="var(--pcb-edge)"
      strokeWidth={2}
      style={rgb?.glow ? { filter: `drop-shadow(0 0 6px ${rgb.color})` } : undefined}
    />
  );
}
