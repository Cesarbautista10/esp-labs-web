import { useEffect } from "react";
import { Caption } from "@/ui/Caption";
import { Terminal, useTerminalLog } from "@/ui/terminal/Terminal";
import type { Tone } from "@/ui/terminal/terminal-log";
import type { WidgetProps } from "@/widgets/types";
import styles from "./intro.module.css";

// Your real `pio device list` output from lesson 00.
const PORTS: readonly (readonly [string, Tone])[] = [
  ["/dev/cu.Bluetooth-Incoming-Port", "plain"],
  ["----------", "plain"],
  ["Hardware ID: n/a", "plain"],
  ["", "plain"],
  ["/dev/cu.usbserial-A5069RR4", "info"],
  ["--------------------------", "plain"],
  ["Hardware ID: USB VID:PID=0403:6001 SER=A5069RR4 LOCATION=2-1.4", "plain"],
  ["Description: FT232R USB UART  <- your board (FTDI USB-to-serial chip)", "warn"],
];

/** Lesson 00 preview: the serial ports your Mac lists, with the board's highlighted. */
export function UsbPreview(_: WidgetProps) {
  const term = useTerminalLog();

  useEffect(() => {
    const timers = PORTS.map(([text, tone], i) => setTimeout(() => term.line(text, tone), 260 * i));
    return () => {
      timers.forEach(clearTimeout);
      term.clear();
    };
  }, [term]);

  return (
    <div className={styles.sim}>
      <Terminal log={term} title="$ uv run pio device list" />
      <Caption>
        Your real result. esptool confirmed an ESP32-S3 rev v0.2 with 8 MB PSRAM and 16 MB flash
        behind this port.
      </Caption>
    </div>
  );
}
