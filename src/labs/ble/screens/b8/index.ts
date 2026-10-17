// B8 Host: the board as the central, your keyboard and mouse as its peripherals.
import type { ScreenSpec } from "@/labs/shared/lab-screen/types";
import { hx } from "../../protocol/hex";
import { drawB8 } from "./draw";
import { b8Connect, b8Disconnect, b8Host, b8Media, b8Note, b8Type } from "./sim";
import { type B8State, b8Init } from "./state";

const BOOT = [
  "ble-lab-b8: NimBLE 2.5.1 up, address 7C:DF:A1:0B:22:61, TX power 9 dBm",
  'Bluetooth lab B8 Host  (ble-lab-b8)  ·  phones see "Bench B8"',
  "  connect [n]                  connect to device n (or the picked one), then explore",
  "  host                         use it: read the Report Map, subscribe to its reports",
] as const;

export const b8Screen: ScreenSpec<B8State> = {
  views: ["devices", "explore", "keyboard", "mouse", "reports", "link", "log"],
  captions: [
    "Connectable devices only, strongest first. A keyboard icon and HID mark keyboards and mice; a key marks devices bonded to the board. The highlighted row is the picked one.",
    "The connected device's GATT table: services (blue), characteristics with R/W/N/I and the public values that were read (teal), descriptors (grey). HID values stay locked until paired.",
    "Your keyboard, typing onto the board: the text with a blinking cursor, the eight modifier caps (amber while held), the held key codes, layout and protocol.",
    "Your mouse as a paint toy: left button draws, right changes colour, middle clears, the wheel sets the brush. The trail shows where the cursor just was.",
    "The raw input reports, newest at the bottom: each byte coloured by its Report Map field (amber modifiers/buttons, teal keys, blue X, violet Y, coral wheel), decoded underneath.",
    "The live link from the central's side: the board leads, the keyboard answers in each connection event. Interval, MTU, PHY, signal and security.",
    "Everything that happened, in order: what the board sent (>), received (<), and the results.",
  ],
  boot: BOOT,
  init: b8Init,
  actions: [
    {
      label: "keyboard: pairing mode, connect, host",
      run: (st, term) => b8Connect(st, term, 0, true),
    },
    { label: "type “Hello bench”", run: (st, term) => b8Type(st, term, "Hello bench") },
    { label: "media: volume up", run: b8Media },
    { label: "mouse: connect + draw", run: (st, term) => b8Connect(st, term, 1, true) },
    { label: "explore the JBL", run: (st, term) => b8Connect(st, term, 2, false) },
    { label: "disconnect", run: b8Disconnect },
  ],
  onCommand(line, st, term) {
    const [cmd, arg] = line.toLowerCase().split(/\s+/);
    if (cmd === "help") {
      BOOT.slice(2).forEach((l) => term.line(l));
      term.line(
        "  list · explore · pair · boot on|off · layout us|de · clear · disconnect · forget",
      );
      return true;
    }
    if (cmd === "list") {
      term.line(`${st.devices.length} connectable devices (strongest first):`);
      st.devices.forEach((d, i) =>
        term.line(
          `${String(i + 1).padStart(3)}  ${d.rssi} dBm  ${d.hid ? "keyboard/mouse" : "unknown       "}  2C:4F:1A:${hx(30 + i)}:7E:0${i}  ${d.name}${d.hid ? "  [HID]" : ""}${d.bonded ? "  [bonded]" : ""}`,
        ),
      );
      return true;
    }
    if (cmd === "connect") {
      const n = arg ? Number(arg) - 1 : st.pick;
      if (!(n >= 0 && n < st.devices.length)) {
        term.line(`[W] connect <1-${st.devices.length}> (the number from list)`, "warn");
        return true;
      }
      b8Connect(st, term, n, false);
      return true;
    }
    if (cmd === "host") {
      if (st.radio !== "connected") {
        term.line("[W] connect a keyboard or mouse first", "warn");
        return true;
      }
      b8Host(st, term);
      return true;
    }
    if (cmd === "layout" && (arg === "us" || arg === "de")) {
      st.de = arg === "de";
      b8Note(
        st,
        term,
        "-",
        `layout ${st.de ? "German (QWERTZ)" : "US (QWERTY)"}: the same keys, other letters`,
      );
      return true;
    }
    if (cmd === "boot" && (arg === "on" || arg === "off")) {
      st.boot = arg === "on";
      b8Note(st, term, "-", `${st.boot ? "boot" : "report"} protocol from the next host`);
      if (st.hosting) b8Host(st, term);
      return true;
    }
    if (cmd === "clear") {
      st.text = "";
      st.strokes = [];
      return true;
    }
    if (cmd === "disconnect") {
      b8Disconnect(st, term);
      return true;
    }
    if (cmd === "forget") {
      st.devices.forEach((d) => (d.bonded = false));
      b8Note(st, term, "-", "every bond deleted: pair again to use a keyboard");
      return true;
    }
    if (cmd === "explore" || cmd === "pair") {
      if (st.radio !== "connected") {
        term.line("[W] connect first", "warn");
        return true;
      }
      b8Note(
        st,
        term,
        "+",
        cmd === "pair"
          ? "already encrypted"
          : `${st.tree.filter((n) => n.l === 0).length} services again`,
      );
      return true;
    }
    return false;
  },
  draw: (g, C, view, t, st) => drawB8(g, C, view, t, st),
};
