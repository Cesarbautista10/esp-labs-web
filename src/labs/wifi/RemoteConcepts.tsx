import { useRef } from "react";
import { useReducedMotion } from "@/lib/media";
import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { ScrollBox } from "@/ui/ScrollBox";
import { usePackets } from "./use-packets";
import styles from "./wifi.module.css";

const s = styles;

const COMPARE: readonly (readonly [string, string, string])[] = [
  ["Who connects", "phone → board", "board → your server (outbound)"],
  ["Works away from home", "no", "yes, through the tunnel"],
  ["Router settings matter", "yes (Wi-Fi isolation)", "no"],
  ["Who signs in", "nobody (home network)", "you: DASHBOARD_KEY · board: its token"],
  ["Firmware updates", "yes", "use variation 1 for now"],
];

/** W2 variation 2 "How remote control works": who dials whom, and the two variations side by side. */
export function RemoteConcepts(_: WidgetProps) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  // Phone and board send towards the public address; the tunnel carries it down to the Mac.
  const { wire, packet } = usePackets(svgRef, (now, i) => {
    const k = reduce ? 0.5 : (now / 1800 + i * 0.3) % 1;
    return i === 2 ? 1 - k : k;
  });

  return (
    <div>
      <ScrollBox label="Remote control drawing">
        <svg
          ref={svgRef}
          className={s.arch}
          viewBox="0 0 720 270"
          role="img"
          aria-label="Your phone reaches the tunnel's public address over HTTPS. Your Mac and the board both dial out to the tunnel, so nothing is opened on your router. The tunnel hands the phone's requests and the board's connection to the Node server on your Mac."
        >
          <rect className={s.zone} x="250" y="132" width="460" height="128" rx="14" />
          <text className={s.sub} x="264" y="252">
            your home · router: nothing opened, nothing forwarded
          </text>
          <path ref={wire(0)} className={s.wire} d="M160 66 H280" />
          <path ref={wire(2)} className={s.wire} d="M375 168 V102" />
          <path ref={wire(1)} className={s.wire} d="M610 160 C 610 90, 570 66, 480 66" />
          <rect className={s.box} x="20" y="36" width="140" height="60" rx="10" />
          <text className={s.lbl} x="34" y="62">
            Phone · laptop
          </text>
          <text className={s.sub} x="34" y="80">
            from anywhere
          </text>
          <rect className={s.box} x="280" y="30" width="200" height="72" rx="22" />
          <text className={s.lbl} x="298" y="56">
            Public https address
          </text>
          <text className={s.sub} x="298" y="74">
            tunnel: ….trycloudflare.com
          </text>
          <text className={s.sub} x="298" y="90">
            or your hosted server
          </text>
          <rect className={s.box} x="275" y="168" width="200" height="64" rx="10" />
          <text className={s.lbl} x="289" y="192">
            Your Mac
          </text>
          <text className={s.sub} x="289" y="210">
            tunnel → Node :8787
          </text>
          <text className={s.sub} x="289" y="224">
            holds key + token
          </text>
          <rect className={`${s.box} ${s.esp}`} x="520" y="160" width="176" height="72" rx="12" />
          <text className={`${s.lbl} ${s.inv}`} x="534" y="186">
            ESP32 w2-remote
          </text>
          <text className={`${s.sub} ${s.inv}`} x="534" y="204">
            dials out: wss /device
          </text>
          <text className={`${s.sub} ${s.inv}`} x="534" y="220">
            signs in with its token
          </text>
          <text className={s.sub} x="168" y="56">
            HTTPS + key
          </text>
          <text className={s.sub} x="384" y="122">
            tunnel (Mac dials out)
          </text>
          <text className={s.sub} x="560" y="108">
            wss (board dials out)
          </text>
          <circle ref={packet(0)} r="5" className={s.pktCopper} />
          <circle ref={packet(1)} r="5" className={s.pktSda} />
          <circle ref={packet(2)} r="5" className={s.pktOk} />
        </svg>
      </ScrollBox>
      <Caption>
        Hosted server instead of a tunnel? The Node server runs there (VPS, Fly.io, Render…) behind
        its HTTPS, and the board dials straight to it: the tunnel and your Mac drop out. Same
        firmware, same <code className={s.inlineCode}>relay wss://…</code>.
      </Caption>
      <ScrollBox label="Variation 1 and variation 2 compared">
        <table className={`${s.api} ${s.cmp}`}>
          <thead>
            <tr>
              <td />
              <th scope="col">Variation 1 · on your Wi-Fi</th>
              <th scope="col">Variation 2 · from anywhere</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([what, lan, remote]) => (
              <tr key={what}>
                <td>{what}</td>
                <td>{lan}</td>
                <td>{remote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollBox>
    </div>
  );
}
