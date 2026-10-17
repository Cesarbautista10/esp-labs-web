// ISO 14443-3 bit-frame anticollision between two cards, as a walk the R3 panel steps through.
import { bccOf, hx, hxs, type Uid } from "./bytes";

export type Who = "A" | "B";

export interface WalkModel {
  readonly a: Uid;
  readonly b: Uid;
  /** UID bits in the order they travel: byte 0 bit 0 first. */
  readonly A: readonly number[];
  readonly B: readonly number[];
  /** First differing bit, 1-based; 0 = identical UIDs. */
  readonly p: number;
  /** The card with a 1 at bit p: the walk picks 1, so it is found first. */
  readonly winner: Who;
}

export interface WalkStep {
  readonly t: string;
  readonly x: string;
}

export const travelOrder = (u: Uid) =>
  u.flatMap((byte) => Array.from({ length: 8 }, (_, j) => (byte >> j) & 1));

export function walkModel(a: Uid, b: Uid): WalkModel {
  const A = travelOrder(a);
  const B = travelOrder(b);
  const p = A.findIndex((x, i) => x !== B[i]) + 1;
  const winner: Who = p && A[p - 1] === 1 ? "A" : "B";
  return { a, b, A, B, p, winner };
}

export function walkSteps(m: WalkModel): WalkStep[] {
  if (!m.p)
    return [
      {
        t: "Identical UIDs",
        x: "Two cards never share a UID (that is the point of it). Change one byte.",
      },
    ];
  const byte = Math.floor((m.p - 1) / 8);
  const bitIn = (m.p - 1) % 8;
  const nvb = ((2 + Math.floor(m.p / 8)) << 4) | (m.p % 8);
  const W = m.winner;
  const L = W === "A" ? "B" : "A";
  const wu = W === "A" ? m.a : m.b;
  const lu = W === "A" ? m.b : m.a;
  return [
    {
      t: "WUPA: both cards wake",
      x: "Both answer ATQA 04 00 at the same instant. Identical bits on top of each other look like one card, so no collision yet.",
    },
    {
      t: "93 20: “all of you, send your UID”",
      x: `Both cards send 32 bits at once. Bits 1–${m.p - 1} are the same and arrive clean. At bit ${m.p} one card sends 0 and the other 1: the reader hears both halves of the bit, a collision. CollReg says CollPos = ${m.p}. Bits after it read as 0 (ValuesAfterColl = 0).`,
    },
    {
      t: `Pick 1 at bit ${m.p}, ask again`,
      x: `The reader sends the ${m.p} bits it now knows, ending in 1: SEL 93, NVB ${hx(nvb)}h (${2 + Math.floor(m.p / 8)} whole bytes + ${m.p % 8} bits). Bit ${m.p} is bit ${bitIn} of UID byte ${byte}. Card ${L} has 0 there, so it stops answering until the next REQA or WUPA.`,
    },
    {
      t: `Only card ${W} answers the rest`,
      x: `Card ${W} sends bits ${m.p + 1}–32 and its BCC. No collision: the reader now has the full UID ${hxs(wu)}, and BCC ${hx(bccOf(wu))} checks out.`,
    },
    {
      t: `SELECT ${hxs(wu)} → SAK 08`,
      x: `93 70 + UID + BCC + CRC_A. Card ${W} is now ACTIVE, ready for authentication and reads. The walk always takes 1 at a collision, which is why the same card wins every time.`,
    },
    {
      t: `HLTA card ${W}, then REQA again`,
      x: `Card ${W} goes to HALT and ignores REQA. Card ${L} was only waiting (READY → back to IDLE), so it answers REQA alone.`,
    },
    {
      t: `93 20 → card ${L} alone: ${hxs(lu)}`,
      x: `No collision this time. SELECT, SAK, HLTA. The next REQA gets no answer at all: the inventory found 2 cards. This is what the firmware's inventory command prints.`,
    },
  ];
}

export type HeardKind = "got" | "coll" | "sent" | "pick" | "";

/** What the reader hears of bit i at a step: a style and the text in the cell. */
export function heardBit(
  m: WalkModel,
  step: number,
  i: number,
): readonly [HeardKind, string] | null {
  const p = m.p;
  if (!p || step === 0) return null;
  const s = (v: number | undefined) => String(v ?? 0);
  if (step === 1) return i < p - 1 ? ["got", s(m.A[i])] : i === p - 1 ? ["coll", "×"] : ["", "0"];
  const w = m.winner === "A" ? m.A : m.B;
  const l = m.winner === "A" ? m.B : m.A;
  if (step === 2) return i < p - 1 ? ["sent", s(w[i])] : i === p - 1 ? ["pick", "1"] : ["", "·"];
  if (step <= 4) return i < p ? ["sent", s(w[i])] : ["got", s(w[i])];
  if (step === 5) return ["", "·"];
  return ["got", s(l[i])];
}

/** Whether a card has gone quiet at this step (lost the walk, or halted). */
export const isSilent = (m: WalkModel, step: number, who: Who) =>
  (step >= 2 && step <= 4 && who !== m.winner) || (step >= 5 && who === m.winner);
