import { useId, useState } from "react";
import type { WidgetProps } from "@/widgets/types";
import {
  type DoorCard,
  type DoorClock,
  doorDecide,
  type Lock,
  type Role,
  ruleTrail,
  type Until,
} from "./door-rules";
import styles from "./door.module.css";

type Setup = DoorCard & DoorClock & { lock: Lock };

const ROLES: readonly Role[] = ["resident", "guest", "maintenance", "admin"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** R7 panel: set up a card, the clock and lockdown, and see which rule decides. */
export function DoorRules(_: WidgetProps) {
  const [st, setSt] = useState<Setup>(() => ({
    lock: "front",
    listed: true,
    role: "resident",
    blocked: false,
    until: "none",
    from: 0,
    to: 0,
    uses: -1,
    lockdown: false,
    synced: true,
    hour: new Date().getHours(),
  }));
  const ids = useId();
  const set = <K extends keyof Setup>(k: K, v: Setup[K]) => setSt((s) => ({ ...s, [k]: v }));
  const decided = doorDecide(st, st);

  return (
    <div className={styles.rulesUi}>
      <div className={styles.rulesForm}>
        <label>
          tapped at
          <select value={st.lock} onChange={(e) => set("lock", e.target.value as Lock)}>
            <option value="front">front door</option>
            <option value="admin">admin room</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={st.listed}
            onChange={(e) => set("listed", e.target.checked)}
          />{" "}
          in the list
        </label>
        <label>
          role
          <select value={st.role} onChange={(e) => set("role", e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={st.blocked}
            onChange={(e) => set("blocked", e.target.checked)}
          />{" "}
          blocked
        </label>
        <label>
          end date
          <select value={st.until} onChange={(e) => set("until", e.target.value as Until)}>
            <option value="none">none</option>
            <option value="future">next week</option>
            <option value="past">yesterday</option>
          </select>
        </label>
        <label>
          hours from
          <select value={st.from} onChange={(e) => set("from", Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hh(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          to
          <select value={st.to} onChange={(e) => set("to", Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hh(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          uses
          <select value={st.uses} onChange={(e) => set("uses", Number(e.target.value))}>
            <option value={-1}>unlimited</option>
            <option value={3}>3 left</option>
            <option value={0}>0 left</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={st.lockdown}
            onChange={(e) => set("lockdown", e.target.checked)}
          />{" "}
          lockdown
        </label>
        <label>
          <input
            type="checkbox"
            checked={st.synced}
            onChange={(e) => set("synced", e.target.checked)}
          />{" "}
          board has internet time
        </label>
        <label htmlFor={`${ids}h`}>
          time now
          <input
            id={`${ids}h`}
            type="range"
            min={0}
            max={23}
            value={st.hour}
            onChange={(e) => set("hour", Number(e.target.value))}
          />
          <output htmlFor={`${ids}h`}>{hh(st.hour)}</output>
        </label>
      </div>
      <ol className={styles.rulesList}>
        {ruleTrail(st, st).map(({ rule, state, text }) => (
          <li key={rule.key} className={styles[state]}>
            <span>{rule.name}</span>
            <b>{text}</b>
          </li>
        ))}
        <li className={decided ? styles.skip : styles.open}>
          <span>All passed</span>
          <b>{decided ? "–" : "OPEN (a guest's uses go down by one)"}</b>
        </li>
      </ol>
      <p className={styles.verdict} aria-live="polite">
        {decided ? (
          <>
            <span className={`${styles.now} ${styles.critical}`}>DENIED · {decided.says}</span> the
            first rule that says no wins; the rest aren't checked.
          </>
        ) : (
          <>
            <span className={`${styles.now} ${styles.good}`}>OPEN</span> every rule passed.
          </>
        )}
      </p>
    </div>
  );
}
