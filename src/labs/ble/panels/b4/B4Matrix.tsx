import { useId, useRef, useState } from "react";
import { useFrameLoop } from "@/lib/animation";
import { useReducedMotion } from "@/lib/media";
import type { WidgetProps } from "@/widgets/types";
import { B4_CAPS, B4_NAMES, b4Method, type PairMethod } from "../../protocol/pairing";
import styles from "../panels.module.css";
import own from "./B4Matrix.module.css";

const COLOR: Readonly<Record<PairMethod, string>> = {
  J: "var(--scope-amber)",
  N: "var(--scope-violet)",
  PI: "var(--ble)",
  PR: "var(--ble)",
  PB: "var(--ble)",
};
const CODE = "482915";

interface Role {
  readonly text: string;
  readonly code?: string;
  readonly col?: string;
}

const ROLES: Readonly<Record<PairMethod, readonly [Role, Role]>> = {
  J: [{ text: "nothing to do" }, { text: "nothing to do" }],
  N: [
    { text: "same? tap yes", code: CODE, col: "var(--scope-violet)" },
    { text: "same? press yes", code: CODE, col: "var(--scope-violet)" },
  ],
  PI: [
    { text: "types it", code: "⌨ ······", col: "var(--muted)" },
    { text: "shows it", code: CODE, col: "var(--ble)" },
  ],
  PR: [
    { text: "shows it", code: CODE, col: "var(--ble)" },
    { text: "types it", code: "⌨ ······", col: "var(--muted)" },
  ],
  PB: [
    { text: "you type the same", code: "⌨ 6 digits", col: "var(--muted)" },
    { text: "on both", code: "⌨ 6 digits", col: "var(--muted)" },
  ],
};

function why(m: PairMethod, mitm: boolean): string {
  switch (m) {
    case "J":
      return !mitm
        ? "Neither side asked for MITM protection, so the stack takes the easy way, whatever the screens can do."
        : "One side can neither show nor enter anything (or both can only show), so there is nothing a person could compare. The link is encrypted against eavesdroppers, but an attacker relaying both sides could have done the same. B4's Vault refuses this: it demands authentication.";
    case "N":
      return "Both sides have a screen and can say yes: each computes six digits from the exchanged public keys. A man in the middle would have different keys, so the numbers would differ. Only with LE Secure Connections.";
    case "PI":
      return "The board shows six random digits; you type them on the phone. Both sides prove, bit by bit, that they know the same passkey before they agree on keys.";
    case "PR":
      return "The phone shows the digits and the board types them. B4's board can't type, so you'll never see this one in the lab: it's how a keyboard pairs (B8).";
    case "PB":
      return "Neither side has a screen: you invent six digits and type them on both keyboards.";
  }
}

const short = (m: PairMethod) =>
  `${B4_NAMES[m].replace("Passkey Entry", "Passkey").replace(" (both type)", " (both)")}${m === "PI" ? " · board shows" : m === "PR" ? " · phone shows" : ""}`;

/** B4: which pairing method two IO capabilities lead to. */
export function B4Matrix(_: WidgetProps) {
  const reduce = useReducedMotion();
  const [init, setInit] = useState(4);
  const [resp, setResp] = useState(0);
  const [sc, setSc] = useState(true);
  const [mitm, setMitm] = useState(true);
  const pathRef = useRef<SVGPathElement>(null);
  const scId = useId();
  const mitmId = useId();
  const m = b4Method(init, resp, sc, mitm);
  const [phoneRole, boardRole] = ROLES[m];

  useFrameLoop(
    pathRef,
    ({ now }) => pathRef.current?.setAttribute("stroke-dashoffset", String(-(now / 40) % 12)),
    !reduce,
  );

  return (
    <div className={styles.wd}>
      <div className={styles.ctl}>
        <label>
          phone (starts pairing)
          <select
            className={styles.select}
            aria-label="Phone's IO capability"
            value={init}
            onChange={(e) => setInit(Number(e.target.value))}
          >
            {B4_CAPS.map((c, i) => (
              <option key={c.k} value={i}>
                {c.k}
              </option>
            ))}
          </select>
        </label>
        <label>
          board
          <select
            className={styles.select}
            aria-label="Board's IO capability"
            value={resp}
            onChange={(e) => setResp(Number(e.target.value))}
          >
            {B4_CAPS.map((c, i) => (
              <option key={c.k} value={i}>
                {c.k}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={scId}>
          <input id={scId} type="checkbox" checked={sc} onChange={(e) => setSc(e.target.checked)} />{" "}
          LE Secure Connections
        </label>
        <label htmlFor={mitmId}>
          <input
            id={mitmId}
            type="checkbox"
            checked={mitm}
            onChange={(e) => setMitm(e.target.checked)}
          />{" "}
          MITM protection asked
        </label>
      </div>
      <div className={styles.scroll}>
        <svg
          viewBox="0 0 680 170"
          className={styles.full}
          role="img"
          aria-label="The phone and the board: who shows the number and who types or confirms it, for the chosen capabilities."
        >
          <Device x={30} label="phone (initiator)" cap={B4_CAPS[init]?.k ?? ""} role={phoneRole} />
          <Device x={530} label="board (responder)" cap={B4_CAPS[resp]?.k ?? ""} role={boardRole} />
          <path
            ref={pathRef}
            d="M 160 85 C 260 40, 420 40, 520 85"
            className={own.link}
            style={{ stroke: COLOR[m] }}
          />
          <text
            x={340}
            y={112}
            textAnchor="middle"
            className={own.method}
            style={{ fill: COLOR[m] }}
          >
            {B4_NAMES[m]}
          </text>
          <text x={340} y={132} textAnchor="middle" className={own.verdict}>
            {m === "J"
              ? "encrypted, but nobody checked: no MITM protection"
              : "a person checks: protected against a man in the middle"}
          </text>
        </svg>
      </div>
      <p className={styles.field} aria-live="polite">
        <b>{B4_NAMES[m]}.</b> {why(m, mitm)}
      </p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>phone ↓ · board →</th>
              {B4_CAPS.map((c) => (
                <th key={c.k}>{c.k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {B4_CAPS.map((c, a) => (
              <tr key={c.k}>
                <td className={styles.mono}>{c.k}</td>
                {B4_CAPS.map((d, b) => {
                  const mm = b4Method(a, b, sc, mitm);
                  const on = a === init && b === resp;
                  return (
                    <td
                      key={d.k}
                      className={own.cell}
                      aria-current={on || undefined}
                      style={{
                        background: `color-mix(in srgb, ${COLOR[mm]} ${on ? 45 : 14}%, transparent)`,
                        outline: on ? `2px solid ${COLOR[mm]}` : undefined,
                      }}
                    >
                      {short(mm)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Device({ x, label, cap, role }: { x: number; label: string; cap: string; role: Role }) {
  return (
    <g>
      <rect x={x} y={30} width={120} height={110} rx={14} className={own.device} />
      <text x={x + 60} y={22} textAnchor="middle" className={own.label}>
        {label}
      </text>
      <text x={x + 60} y={158} textAnchor="middle" className={own.cap}>
        {cap}
      </text>
      <text x={x + 60} y={96} textAnchor="middle" className={own.role}>
        {role.text}
      </text>
      {role.code ? (
        <text x={x + 60} y={74} textAnchor="middle" className={own.code} style={{ fill: role.col }}>
          {role.code}
        </text>
      ) : null}
    </g>
  );
}
