import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/media";
import { Button, ButtonRow } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { hxs, RF } from "../protocol/bytes";
import styles from "./door.module.css";

/** The lab blocks a snapshot saves and a copy writes: sectors 1 and 2, trailers excluded. */
const LAB = [4, 5, 6, 8, 9, 10] as const;
type CardKey = "white" | "tag";
type Data = Readonly<Record<number, string>>;
interface CopyCard {
  readonly name: string;
  readonly uid: string;
  readonly data: Data;
}
type Mark = "go" | "ok" | "skip";
type Outcome =
  | { kind: "none" }
  | { kind: "read" }
  | { kind: "saved" }
  | { kind: "copied"; done: number; skipped: number };

const fresh = (): Record<CardKey, CopyCard> => ({
  white: {
    name: "White card",
    uid: hxs(RF.card.uid),
    data: {
      4: "“White card”",
      5: "“R7 resident”",
      6: "zeros",
      8: "value 10",
      9: "value 10",
      10: "zeros",
    },
  },
  tag: {
    name: "Key tag",
    uid: hxs(RF.tag.uid),
    data: { 4: "“Key tag”", 5: "“R7 guest”", 6: "zeros", 8: "zeros", 9: "zeros", 10: "zeros" },
  },
});

const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, prefersReducedMotion() ? 0 : ms));

function CardBlocks({
  who,
  card,
  closed,
  marks,
}: {
  who: CardKey;
  card: CopyCard;
  closed: boolean;
  marks: Readonly<Record<string, Mark>>;
}) {
  return (
    <div className={styles.cpCard}>
      <h4>
        {card.name} <small>UID {card.uid}</small>
      </h4>
      {[0, 1, 2].map((sec) => (
        <div key={sec} className={styles.cpRow}>
          <span>S{sec}</span>
          {[0, 1, 2, 3].map((i) => {
            const b = sec * 4 + i;
            let cls = "";
            let txt: string;
            if (b === 0) [cls, txt] = [styles.uid ?? "", card.uid];
            else if (i === 3) [cls, txt] = [styles.trailer ?? "", "keys"];
            else if (sec === 0) txt = "–";
            else if (who === "tag" && sec === 2 && closed)
              [cls, txt] = [`${styles.lab} ${styles.closed}`, "doesn't open"];
            else [cls, txt] = [styles.lab ?? "", card.data[b] ?? ""];
            const mark = marks[`${who}-${b}`];
            return (
              <span
                key={b}
                className={`${styles.cpCell} ${cls} ${mark ? styles[mark] : ""}`}
                title={`block ${b}: ${txt}`}
              >
                <b>{b}</b>
                {txt}
              </span>
            );
          })}
        </div>
      ))}
      <div className={styles.cpMore}>sectors 3-15: not touched</div>
    </div>
  );
}

/** R7 panel: save the white card's data, copy it onto the key tag, and see what moves. */
export function DoorCopy(_: WidgetProps) {
  const [cards, setCards] = useState(fresh);
  const [saved, setSaved] = useState<Data | null>(null);
  const [closed, setClosed] = useState(false);
  const [running, setRunning] = useState(false);
  const [marks, setMarks] = useState<Readonly<Record<string, Mark>>>({});
  const [out, setOut] = useState<Outcome>({ kind: "none" });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function copy() {
    if (running) return;
    setRunning(true);
    let snapshot = saved;
    if (!snapshot) {
      snapshot = { ...cards.white.data };
      setSaved(snapshot);
      setOut({ kind: "read" });
    }
    let done = 0;
    let skipped = 0;
    const tagMarks: Record<string, Mark> = {};
    for (const b of LAB) {
      setMarks({ ...tagMarks, [`white-${b}`]: "go" });
      await sleep(260);
      if (!alive.current) return;
      const ok = !(closed && b >= 8);
      if (ok) {
        const value = snapshot[b] ?? "";
        setCards((c) => ({ ...c, tag: { ...c.tag, data: { ...c.tag.data, [b]: value } } }));
        done++;
      } else skipped++;
      tagMarks[`tag-${b}`] = ok ? "ok" : "skip";
      setMarks({ ...tagMarks });
      await sleep(140);
      if (!alive.current) return;
    }
    setOut({ kind: "copied", done, skipped });
    setRunning(false);
  }

  function restart(nextClosed = closed) {
    if (running) return;
    setClosed(nextClosed);
    setCards(fresh());
    setSaved(null);
    setMarks({});
    setOut({ kind: "none" });
  }

  return (
    <div className={styles.cpUi}>
      <div className={styles.cpCtl}>
        <ButtonRow>
          <Button
            onClick={() => {
              setSaved({ ...cards.white.data });
              setMarks(Object.fromEntries(LAB.map((b) => [`white-${b}`, "ok"])));
              setOut({ kind: "saved" });
            }}
          >
            Save White card
          </Button>
          <Button onClick={copy} disabled={running}>
            Copy White card → Key tag
          </Button>
          <Button onClick={() => restart()}>Start again</Button>
        </ButtonRow>
        <label>
          <input
            type="checkbox"
            checked={closed}
            disabled={running}
            onChange={(e) => restart(e.target.checked)}
          />{" "}
          Key tag's sector 2 has another key
        </label>
      </div>
      <div className={styles.cpLegend}>
        <span>
          <i className={styles.uid} />
          block 0: UID + maker data, never written
        </span>
        <span>
          <i className={styles.lab} />
          lab blocks: saved and copied
        </span>
        <span>
          <i className={styles.trailer} />
          trailer: keys + access bits, never written
        </span>
        <span>
          <i />
          sector 0 data: outside the lab area
        </span>
      </div>
      <div className={styles.cpCards}>
        <CardBlocks who="white" card={cards.white} closed={closed} marks={marks} />
        <span className={styles.cpArrow} aria-hidden="true">
          →
        </span>
        <CardBlocks who="tag" card={cards.tag} closed={closed} marks={marks} />
      </div>
      <p className={styles.cpOut} aria-live="polite">
        {out.kind === "read" ? "Read the white card first: 6 of 6 blocks." : null}
        {out.kind === "saved" ? (
          <span>
            <span className={styles.now}>6 of 6 saved</span>Snapshot “White card” on the board
            (NVS). Blocks 0 and the trailers aren't part of it.
          </span>
        ) : null}
        {out.kind === "copied" ? (
          <>
            <span>
              <span className={`${styles.now} ${out.skipped ? styles.warn : ""}`}>
                {out.done} of 6 copied
              </span>
              {out.skipped
                ? "Sector 2 didn't open with the factory key, so blocks 8-10 were skipped: the board never forces a sector."
                : "Every block written and read back."}
            </span>
            <span>
              UID still <b>{cards.tag.uid}</b>: a tap with the key tag is looked up as{" "}
              <b>Key tag</b>, not as White card. The door decides by UID, and the UID didn't move.
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}
