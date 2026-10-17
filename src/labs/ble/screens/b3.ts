// B3 Connect & talk: gatt · message · link · log.
import { DISPLAY_FONT, drawText, MONO_FONT } from "@/lib/canvas";
import type { ScreenSpec } from "@/labs/shared/lab-screen/types";
import type { TerminalPrinter } from "@/ui/terminal/terminal-log";
import { bleSimLog, later } from "../kit/state";
import { type BenchState, benchInit, benchOp } from "./shared/bench";
import { drawGatt, drawLink, drawLog } from "./shared/draw";

const connected = (st: BenchState, term: TerminalPrinter): boolean => {
  if (st.radio === "connected") return true;
  term.line("[W] connect first", "warn");
  return false;
};

const click = (st: BenchState, term: TerminalPrinter) => {
  st.count++;
  if (st.sub[2]) {
    benchOp(st, 2, "notify");
    st.tx++;
    bleSimLog(st, term, ">", `notify Button: click #${st.count}`);
  } else bleSimLog(st, term, "-", `button click #${st.count} (nobody subscribed)`);
  st.view = (st.view + 1) % 4;
};

export const b3Screen: ScreenSpec<BenchState> = {
  views: ["gatt", "message", "link", "log"],
  captions: [
    "The Bench service as a table: name, properties (R read, W write, N notify) and the current value. An operation lights its row: teal read, blue write, violet notify, amber subscribe. A dot travels to or from the phone on the right; a bell means subscribed.",
    "The last message written from the phone, word-wrapped in 12 pt, and the LED's colour as a glowing disc.",
    "The live connection: who is central, the connection events ticking (slowed down 20x), interval, MTU, latency, timeout, PHY, RSSI, security, and the traffic counters.",
    "The activity log, newest at the bottom: < received from the phone, > sent to it, + good news, ! warnings.",
  ],
  boot: [
    "ble-lab-b3: NimBLE 2.5.1 up, address 7C:DF:A1:0B:5E:3C, TX power 9 dBm",
    '  - advertising as "Bench B3"',
    "",
    'Bluetooth lab B3 Connect & talk  (ble-lab-b3)  ·  phones see "Bench B3"',
  ],
  init: benchInit,
  actions: [
    {
      label: "phone: connect",
      run(st, term) {
        if (st.radio === "connected") return;
        st.radio = "connected";
        bleSimLog(st, term, "+", "connected: 5A:3C:91:2E:7B:44");
        bleSimLog(st, term, "-", "MTU 255: 252 bytes of data per packet");
      },
    },
    {
      label: "phone: write LED FF5000",
      run(st, term) {
        if (!connected(st, term)) return;
        st.led = [255, 80, 0];
        benchOp(st, 0, "write");
        st.rx++;
        bleSimLog(st, term, "<", "write LED FF 50 00");
      },
    },
    {
      label: "phone: write Message",
      run(st, term) {
        if (!connected(st, term)) return;
        st.message = "hello bench";
        benchOp(st, 1, "write");
        st.rx++;
        bleSimLog(st, term, "<", 'write Message "hello bench"');
      },
    },
    {
      label: "phone: subscribe Button",
      run(st, term) {
        if (!connected(st, term)) return;
        st.sub[2] = true;
        benchOp(st, 2, "subscribe");
        bleSimLog(st, term, "<", "subscribe Button (CCCD = 1)");
      },
    },
    { label: "board: click", run: click },
  ],
  onCommand(line, st, term) {
    const [cmd, ...rest] = line.split(/\s+/);
    const up = st.radio === "connected";
    if (cmd === "message" && rest.length) {
      st.message = rest.join(" ").slice(0, 40);
      st.view = 1;
      bleSimLog(st, term, "-", "Message set here: a phone that reads it now gets it");
      return true;
    }
    if (cmd === "params" && up) {
      const slow = rest[0] === "slow";
      st.interval = slow ? 112.5 : 22.5;
      st.latency = slow ? 4 : 0;
      bleSimLog(st, term, ">", `asked the phone for ${rest[0] ?? ""} parameters`);
      later(st, 600, () =>
        bleSimLog(st, term, "-", `new params: ${st.interval.toFixed(2)} ms, latency ${st.latency}`),
      );
      return true;
    }
    if (cmd === "phy" && up) {
      st.phy = rest[0] === "2m" ? "2M/2M" : "1M/1M";
      bleSimLog(st, term, "-", `PHY now ${st.phy.replace("/", " / ")}`);
      return true;
    }
    if (cmd === "disconnect" && up) {
      st.radio = "advertising";
      st.sub = st.sub.map(() => false);
      bleSimLog(st, term, "!", "disconnected 0x16: we hung up");
      return true;
    }
    if (cmd === "press") {
      click(st, term);
      return true;
    }
    return false;
  },
  draw(g, C, view, t, st) {
    if (view === 0) drawGatt(g, C, t, st);
    else if (view === 1) {
      const glow = g.createRadialGradient(270, 96, 2, 270, 96, 28);
      glow.addColorStop(0, `rgb(${st.led.join(",")})`);
      glow.addColorStop(1, C.paper);
      g.fillStyle = glow;
      g.beginPath();
      g.arc(270, 96, 28, 0, 7);
      g.fill();
      drawText(g, 240, 140, st.led.some(Boolean) ? "LED from phone" : "LED: write 0001", C.muted);
      if (st.message) {
        drawText(g, 10, 80, st.message, C.ink, `bold 18px ${DISPLAY_FONT}`);
        drawText(g, 10, 150, "written 3s ago", C.muted, `8px ${MONO_FONT}`);
      } else {
        drawText(g, 10, 70, "Write a message", C.ink, `bold 12px ${DISPLAY_FONT}`);
        drawText(g, 10, 86, "to characteristic ba5e0002 in nRF Connect", C.muted);
      }
    } else if (view === 2) drawLink(g, C, t, st);
    else drawLog(g, C, st);
  },
};
