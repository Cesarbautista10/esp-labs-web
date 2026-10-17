import { type ReactNode, useRef } from "react";
import { useReducedMotion } from "@/lib/media";
import type { WidgetProps } from "@/widgets/types";
import { ScrollBox } from "@/ui/ScrollBox";
import { usePackets } from "./use-packets";
import styles from "./wifi.module.css";

const s = styles;
const admin = <span className={s.adm}>admin</span>;

const API: readonly (readonly [string, string, ReactNode])[] = [
  ["GET", "/api/status · /api/networks", "what the board is doing; last scan"],
  ["POST", "/api/scan", "scan now"],
  ["PUT", "/api/view · /api/settings", "screen view; auto-scan, brightness"],
  ["PUT", "/api/led · /api/message", "LED colour; text on the screen"],
  ["PUT", "/api/wifi", <>save a network (open during set-up, {admin} after)</>],
  [
    "DELETE · POST",
    "/api/wifi · /api/reboot · /api/ota",
    <>{admin}: forget, restart, firmware update</>,
  ],
  ["WS", "/ws", "pushes status every second, scans, button presses, update progress"],
];

/** W2 "How the pieces talk": phone, React app, Node server and board, and the board's API. */
export function WebConcepts(_: WidgetProps) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  // Alternate: a request goes out, then a live update comes back.
  const { wire, packet } = usePackets(svgRef, (now, i) => {
    if (reduce) return 0.5;
    const phase = now / 1600 + i * 0.33;
    const k = phase % 1;
    return Math.floor(phase) % 2 === 1 ? 1 - k : k;
  });

  return (
    <div>
      <ScrollBox label="Architecture drawing">
        <svg
          ref={svgRef}
          className={s.arch}
          viewBox="0 0 720 250"
          role="img"
          aria-label="The phone talks to the board directly. The React app talks to the Node server, which talks to the board. The board pushes live updates back over WebSockets."
        >
          <path ref={wire(0)} className={s.wire} d="M150 60 H500" />
          <path ref={wire(1)} className={s.wire} d="M150 190 H260" />
          <path ref={wire(2)} className={s.wire} d="M400 190 C 460 190, 470 120, 520 110" />
          <rect className={s.box} x="20" y="30" width="130" height="60" rx="10" />
          <text className={s.lbl} x="34" y="56">
            Phone
          </text>
          <text className={s.sub} x="34" y="74">
            bench.local page
          </text>
          <rect className={s.box} x="20" y="160" width="130" height="60" rx="10" />
          <text className={s.lbl} x="34" y="186">
            React app
          </text>
          <text className={s.sub} x="34" y="204">
            your browser on the Mac
          </text>
          <rect className={s.box} x="260" y="160" width="140" height="60" rx="10" />
          <text className={s.lbl} x="274" y="186">
            Node server
          </text>
          <text className={s.sub} x="274" y="204">
            holds ESP_TOKEN
          </text>
          <rect className={`${s.box} ${s.esp}`} x="500" y="30" width="200" height="110" rx="12" />
          <text className={`${s.lbl} ${s.inv}`} x="516" y="58">
            ESP32 wifi-lab-w2
          </text>
          <text className={`${s.sub} ${s.inv}`} x="516" y="78">
            REST /api/…
          </text>
          <text className={`${s.sub} ${s.inv}`} x="516" y="96">
            live /ws
          </text>
          <text className={`${s.sub} ${s.inv}`} x="516" y="114">
            page / · OTA /api/ota
          </text>
          <text className={s.sub} x="290" y="50">
            REST + WebSocket
          </text>
          <text className={s.sub} x="160" y="178">
            /api + /ws
          </text>
          <text className={s.sub} x="430" y="236">
            REST + WebSocket (token added for admin)
          </text>
          <circle ref={packet(0)} r="5" className={s.pktCopper} />
          <circle ref={packet(1)} r="5" className={s.pktSda} />
          <circle ref={packet(2)} r="5" className={s.pktOk} />
        </svg>
      </ScrollBox>
      <ScrollBox label="The board's web API">
        <table className={s.api}>
          <tbody>
            {API.map(([method, path, what]) => (
              <tr key={method + path}>
                <td>{method}</td>
                <td>{path}</td>
                <td>{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBox>
    </div>
  );
}
