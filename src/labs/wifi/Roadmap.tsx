import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { ScrollBox } from "@/ui/ScrollBox";
import styles from "./wifi.module.css";

interface LessonRow {
  readonly id: string;
  readonly title: string;
  readonly capability: string;
  readonly needs: string;
  readonly built?: boolean;
}

const LESSONS: readonly LessonRow[] = [
  {
    id: "W1",
    title: "Scan & join",
    capability:
      "scanner views, join your network, password stored on the chip, reconnects by itself, status view with clock, IP and signal chart, bench.local",
    needs: "nothing",
    built: true,
  },
  {
    id: "W2",
    title: "Phone control",
    capability:
      "REST API + WebSocket, phone page at bench.local, set-up network, firmware updates over HTTP, React + Node dashboard on your Mac",
    needs: "W1",
    built: true,
  },
  {
    id: "W3",
    title: "Internet & AI",
    capability:
      "HTTPS + JSON from the internet (Open-Meteo weather); the Bench Oracle: any AI model through a LiteLLM gateway, answers as structured JSON",
    needs: "W1 + the LiteLLM gateway and a provider key for the oracle",
    built: true,
  },
  {
    id: "W4",
    title: "Radio lab (bonus)",
    capability: "channel activity from packet counts; board-to-board messages with ESP-NOW",
    needs: "a 2nd ESP32 for ESP-NOW",
  },
  {
    id: "W5",
    title: "Hardware Diary",
    capability: "post bench entries and photos of your builds to this repo's API",
    needs: "W3 + the API running",
  },
];

interface PartRow {
  readonly part: string;
  readonly about: string;
  readonly adds: string;
  readonly have?: boolean;
}

const PARTS: readonly PartRow[] = [
  {
    part: "BME280",
    about: "€3–10 · I2C, 4 wires",
    adds: "Temperature, humidity, pressure (BME680 adds air quality): real data for the phone dashboard and Hardware Diary posts",
    have: true,
  },
  {
    part: "2nd ESP32",
    about: "€3–8 · any C3 or S3",
    adds: "ESP-NOW without a router, a wireless remote, one board as access point and the other joining it",
    have: true,
  },
  {
    part: "Power bank",
    about: "you likely have one",
    adds: "A portable scanner: walk around and map the signal room by room",
    have: true,
  },
  {
    part: "Rotary encoder",
    about: "€1–2 · KY-040",
    adds: "Scroll and select in menus: network picker, settings",
  },
  {
    part: "WS2812 ring",
    about: "€2–5 · 1 data wire",
    adds: "A colour signal gauge; pick colours from your phone",
  },
  {
    part: "INA219",
    about: "€2–4 · I2C",
    adds: "Measure Wi-Fi's power draw (about 300 mA peaks) and what sleep modes save",
  },
  { part: "Passive buzzer", about: "€1", adds: "Sound alerts: network lost, value over a limit" },
];

/** W1 "The Wi-Fi track": what each lab adds, and parts that unlock more. */
export function Roadmap(_: WidgetProps) {
  return (
    <div>
      <ScrollBox label="Wi-Fi lessons">
        <table className={styles.roadmap}>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Lesson</th>
              <th scope="col">Wi-Fi capability</th>
              <th scope="col">Needs</th>
            </tr>
          </thead>
          <tbody>
            {LESSONS.map((r) => (
              <tr key={r.id} className={r.built ? styles.now : undefined}>
                <td>{r.id}</td>
                <td>{r.title}</td>
                <td>{r.capability}</td>
                <td className={styles.needs}>{r.needs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBox>
      <Caption>
        Each lab has its own firmware and command (
        <code className={styles.inlineCode}>wifi-lab-w1</code>,{" "}
        <code className={styles.inlineCode}>wifi-lab-w2</code>, …); what they share lives in{" "}
        <code className={styles.inlineCode}>lib/wifi-kit</code>, so each lab adds features instead
        of starting over.
      </Caption>
      <h4 className={`${styles.subhead} ${styles.subheadGap}`}>Parts that unlock more</h4>
      <ScrollBox label="Parts that unlock more">
        <table className={styles.roadmap}>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">About</th>
              <th scope="col">What it adds</th>
            </tr>
          </thead>
          <tbody>
            {PARTS.map((p) => (
              <tr key={p.part} className={p.have ? styles.now : undefined}>
                <td>{p.part}</td>
                <td className={styles.needs}>{p.about}</td>
                <td>{p.adds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBox>
    </div>
  );
}
