import type { ReactNode } from "react";
import type { WidgetProps } from "@/widgets/types";
import styles from "./compare.module.css";

const ROWS: readonly (readonly [string, ReactNode, ReactNode])[] = [
  [
    "Direction",
    <>
      <b>Output.</b> The ESP32 sends; the screen only listens.
    </>,
    <>
      <b>Input.</b> The ESP32 listens; the button only reports.
    </>,
  ],
  [
    "Wires",
    "8: VCC + GND for power, SCL + SDA for data, CS, DC, RES, BLK for control",
    "2: GPIO 5 and GND",
  ],
  ["Power", "Needs 3V3 from the board to light up", "None. A button is just a switch"],
  [
    "Signal",
    "SPI bus: a clock (SCL) and data (SDA), 40 million bits per second",
    "One level: HIGH (up) or LOW (pressed), a few changes per second",
  ],
  [
    "Which pins",
    "SCL/SDA on the S3's fast SPI pins 12/11; the other 4 on any safe GPIO",
    "Any safe GPIO. We picked 5",
  ],
  [
    "Helper inside the chip",
    "The SPI peripheral clocks the bits out for us",
    "The internal pull-up resistor keeps the pin HIGH until pressed",
  ],
  [
    "Code",
    <>
      <code>SPI.begin(12, -1, 11, 10)</code>
      <br />
      <code>tft.init(170, 320)</code>
    </>,
    <>
      <code>pinMode(5, INPUT_PULLUP)</code>
      <br />
      <code>attachInterruptArg(…, CHANGE)</code>
    </>,
  ],
  [
    "If it goes wrong",
    "Black or white screen: check VCC, BLK, RES",
    "Always or never pressed: use diagonal legs",
  ],
];

/** Lesson 03b variation 2: the screen (an output) and the button (an input), side by side. */
export function ScreenVsButton(_: WidgetProps) {
  return (
    <div className={styles.cmp} role="table" aria-label="Screen versus button">
      <div role="row" className={styles.head}>
        <div role="columnheader" className={`${styles.k} ${styles.blank}`}>
          <span className={styles.srOnly}>Aspect</span>
        </div>
        <div role="columnheader" className={styles.h}>
          <i style={{ background: "var(--w-scl)" }}>OUTPUT</i>Screen
        </div>
        <div role="columnheader" className={styles.h}>
          <i style={{ background: "var(--w-btn)" }}>INPUT</i>Button
        </div>
      </div>
      {ROWS.map(([key, screen, button]) => (
        <div role="row" key={key} className={styles.row}>
          <div role="rowheader" className={styles.k}>
            {key}
          </div>
          <div role="cell">{screen}</div>
          <div role="cell">{button}</div>
        </div>
      ))}
    </div>
  );
}
