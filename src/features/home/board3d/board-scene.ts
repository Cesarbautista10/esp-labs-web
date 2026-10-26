// The UNIT Electronics PULSAR C6 as an illustrated 3D model: board, the bare ESP32-C6 chip, the
// ceramic antenna, one USB-C port, BOOT and RST, the RGB LED, the microSD slot, the Qwiic
// connector and the 30 header pins, with the silkscreen drawn from the same pin list as the pinout.
import type * as Three from "three";
import { HEADER, pinLabel } from "@/domain/board";
import { definePalette } from "@/lib/palette";
import type { Stage3d, ThreeModule } from "@/ui/stage3d/stage3d";
import { glowTexture, toon } from "@/ui/stage3d/toon";
import type { PartId } from "./parts";

const colours = definePalette({
  pcb: "--pcb",
  edge: "--pcb-edge",
  silk: "--silk",
  silkDim: "--silk-dim",
  pad: "--pad",
  copper: "--copper",
  gold: "--gold",
  metal: "--metal",
  metalDark: "--metal-dark",
  plastic: "--plastic",
  hotspot: "--hotspot",
  power: "--danger",
  white: "--card-white",
  mono: "--font-mono",
});

// 1 unit = 10 mm. The board is 45 × 18 mm (Arduino Nano); USB end at -x, antenna end at +x,
// top face at y = 0. The left header row (the pinout's left column) is at +z.
const L = 4.5;
const W = 1.8;
const H = 0.16;
const PITCH = 0.254;
const PIN0_X = -1.778; // the first header pin, at the USB end
const ROW_Z = 0.762; // the rows are 0.6" apart
const pinX = (i: number) => PIN0_X + i * PITCH;
const CHIP_X = 0.7;
const LED: readonly [number, number] = [0.7, -0.4];
const ANT: readonly [number, number] = [2.05, 0.44];

/** Where each callout's leader lands on the model. */
export const PART_ANCHORS: Record<PartId, readonly [number, number, number]> = {
  usb: [-2.1, 0.3, 0],
  buttons: [-1.4, 0.2, 0.3],
  rgb: [LED[0], 0.1, LED[1]],
  module: [CHIP_X, 0.12, 0],
  antenna: [ANT[0], 0.1, ANT[1]],
  headers: [pinX(7), 0.06, ROW_Z],
};

export interface BoardScene {
  /** Glow one part (the callout you are on), or none. */
  highlight(part: PartId | null): void;
}

type Toon = Three.MeshToonMaterial;

export function buildBoardScene(T: ThreeModule, S: Stage3d): BoardScene {
  const C = colours();
  const board = new T.Group();
  S.scene.add(board);
  const parts: Record<PartId, Toon[]> = {
    usb: [],
    buttons: [],
    rgb: [],
    module: [],
    antenna: [],
    headers: [],
  };
  /** A material that belongs to a part (so the part can glow on its own). */
  const mat = (
    part: PartId | null,
    color: string,
    extra: Three.MeshToonMaterialParameters = {},
  ) => {
    const m = toon(T, color, extra);
    if (part) parts[part].push(m);
    return m;
  };
  const mesh = (
    geo: Three.BufferGeometry,
    material: Three.Material | Three.Material[],
    x: number,
    y: number,
    z: number,
    outline = true,
  ) => {
    const m = new T.Mesh(geo, material);
    m.position.set(x, y, z);
    m.userData.noOutline = !outline;
    board.add(m);
    return m;
  };

  // The board: silkscreen on top, a lighter edge like the fibreglass core.
  const top = toon(T, C.white, { map: silkscreen(T, C) });
  const side = toon(T, C.edge);
  mesh(new T.BoxGeometry(L, H, W), [side, side, top, toon(T, C.pcb), side, side], 0, -H / 2, 0);

  // The ESP32-C6FH4: a 5 × 5 mm QFN with the flash inside, straight on the board.
  const chip = mat("module", C.plastic);
  const chipTop = mat("module", C.plastic, { map: chipLabel(T, C) });
  mesh(
    new T.BoxGeometry(0.5, 0.09, 0.5),
    [chip, chip, chipTop, chip, chip, chip],
    CHIP_X,
    0.045,
    0,
  );
  // The ceramic chip antenna at the far corner, keep-out copper around it.
  mesh(new T.BoxGeometry(0.32, 0.1, 0.12), mat("antenna", C.white), ANT[0], 0.05, ANT[1]);
  mesh(new T.BoxGeometry(0.06, 0.04, 0.1), mat("antenna", C.gold), ANT[0] - 0.19, 0.02, ANT[1], false);
  mesh(new T.BoxGeometry(0.06, 0.04, 0.1), mat("antenna", C.gold), ANT[0] + 0.19, 0.02, ANT[1], false);

  // One USB-C receptacle at the USB end: the chip's own USB, for flashing and the serial monitor.
  const usbShape = roundedShape(T, 0.89, 0.32, 0.15);
  const usbGeo = new T.ExtrudeGeometry(usbShape, { depth: 0.73, bevelEnabled: false });
  usbGeo.rotateY(-Math.PI / 2);
  mesh(usbGeo, mat("usb", C.metal), -L / 2 + 0.65, 0.16, 0);
  mesh(new T.BoxGeometry(0.02, 0.2, 0.7), mat("usb", C.plastic), -L / 2 - 0.085, 0.16, 0, false);

  // BOOT (left row side) and RST (right row side): small tactile switches beside the port.
  for (const z of [0.3, -0.3]) {
    mesh(new T.BoxGeometry(0.28, 0.1, 0.28), mat("buttons", C.metal), -1.4, 0.05, z);
    mesh(new T.CylinderGeometry(0.08, 0.08, 0.08, 20), mat("buttons", C.plastic), -1.4, 0.14, z);
  }

  // The RGB LED: a white 2020 WS2812B; its colour and glow are set every frame.
  const ledMat = mat("rgb", C.white, { emissive: new T.Color(C.hotspot), emissiveIntensity: 0.6 });
  mesh(new T.BoxGeometry(0.2, 0.08, 0.2), ledMat, LED[0], 0.04, LED[1]);
  const glowMat = new T.SpriteMaterial({
    map: glowTexture(T),
    color: new T.Color(C.hotspot),
    blending: T.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const glow = new T.Sprite(glowMat);
  glow.position.set(LED[0], 0.16, LED[1]);
  glow.scale.setScalar(0.8);
  board.add(glow);

  // The microSD slot (a metal cage), the Qwiic connector, the 3.3 V regulator and charger, the
  // power LED and a few passives.
  mesh(new T.BoxGeometry(1.1, 0.16, 0.9), toon(T, C.metal), -0.3, 0.08, 0);
  mesh(new T.BoxGeometry(0.3, 0.26, 0.56), toon(T, C.white), 2.05, 0.13, -0.12);
  mesh(new T.BoxGeometry(0.3, 0.1, 0.16), toon(T, C.plastic), -1.0, 0.05, 0.36);
  mesh(new T.BoxGeometry(0.2, 0.08, 0.2), toon(T, C.plastic), -1.0, 0.04, -0.36);
  const powerLed = toon(T, C.power, { emissive: new T.Color(C.power), emissiveIntensity: 0.8 });
  mesh(new T.BoxGeometry(0.1, 0.05, 0.06), powerLed, -1.75, 0.025, 0.55, false);
  const passive = toon(T, C.metalDark);
  for (const [x, z, turn] of PASSIVES) {
    const m = mesh(new T.BoxGeometry(0.1, 0.05, 0.05), passive, x, 0.025, z, false);
    m.rotation.y = turn;
  }

  // The header pins point down into a breadboard; black spacers under the board hold them.
  const spacer = mat("headers", C.plastic);
  const pin = mat("headers", C.gold);
  const solder = mat("headers", C.metal);
  const pinGeo = new T.BoxGeometry(0.064, 0.86, 0.064);
  const jointGeo = new T.CylinderGeometry(0.03, 0.065, 0.06, 10);
  for (const z of [-ROW_Z, ROW_Z]) {
    const n = HEADER.L.length;
    mesh(new T.BoxGeometry(n * PITCH, 0.25, PITCH), spacer, pinX((n - 1) / 2), -H - 0.125, z);
    for (let i = 0; i < n; i++) {
      mesh(pinGeo, pin, pinX(i), -0.43 + 0.06, z, false);
      mesh(jointGeo, solder, pinX(i), 0.03, z, false);
    }
  }

  // Radio waves leave the antenna: half rings that grow and fade.
  const waves = Array.from({ length: 3 }, () => {
    const m = new T.MeshBasicMaterial({
      color: new T.Color(C.hotspot),
      transparent: true,
      opacity: 0,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const ring = new T.Mesh(new T.RingGeometry(0.62, 0.66, 40, 1, 0, Math.PI), m);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(L / 2 + 0.05, 0.05, ANT[1]);
    board.add(ring);
    return { ring, m };
  });

  let lit: PartId | null = null;
  const hotspot = new T.Color(C.hotspot);
  const black = new T.Color(0);
  const led = new T.Color();

  S.onFrame((t) => {
    // The LED walks the colour wheel, like lesson 01's firmware; still when motion is down.
    led.setHSL(S.reduce ? 0.47 : (t * 0.08) % 1, 0.9, 0.55);
    ledMat.emissive.copy(led);
    glowMat.color.copy(led);
    glow.scale.setScalar(lit === "rgb" ? 1.2 : 0.8);
    waves.forEach(({ ring, m }, i) => {
      if (S.reduce) {
        m.opacity = lit === "antenna" ? 0.5 : 0;
        ring.scale.setScalar(1.2 + i * 0.5);
        return;
      }
      const k = (t * 0.35 + i / waves.length) % 1;
      ring.scale.setScalar(0.4 + k * 2.4);
      m.opacity = (1 - k) * (lit === "antenna" ? 0.85 : 0.35);
    });
    const pulse = S.reduce ? 0.35 : 0.25 + 0.15 * Math.sin(t * 5);
    for (const [part, list] of Object.entries(parts) as [PartId, Toon[]][]) {
      if (part === "rgb") continue;
      for (const m of list) {
        m.emissive.copy(part === lit ? hotspot : black);
        m.emissiveIntensity = part === lit ? pulse : 0;
      }
    }
  });

  return {
    highlight(part) {
      lit = part;
    },
  };
}

// Small parts scattered as on the real board: [x, z, rotation].
const PASSIVES: readonly (readonly [number, number, number])[] = [
  [-1.0, 0.1, 0],
  [-1.0, -0.1, 0],
  [-0.85, 0.55, Math.PI / 2],
  [0.35, 0.38, 0],
  [0.35, -0.38, 0],
  [1.05, 0.35, Math.PI / 2],
  [1.05, -0.35, Math.PI / 2],
  [1.7, 0.4, 0],
];

/** A rounded rectangle centred on the origin (the face of a USB-C receptacle). */
function roundedShape(T: ThreeModule, w: number, h: number, r: number): Three.Shape {
  const s = new T.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

type Colours = ReturnType<typeof colours>;

/** The board's top face: solder mask, traces, pads and silkscreen, drawn once into a canvas. */
function silkscreen(T: ThreeModule, C: Colours): Three.CanvasTexture {
  const k = 2048 / L; // pixels per unit
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = Math.round(W * k);
  const g = c.getContext("2d");
  const tex = new T.CanvasTexture(c);
  if (!g) return tex;
  const px = (x: number) => (x + L / 2) * k;
  const pz = (z: number) => (z + W / 2) * k;
  g.fillStyle = C.pcb;
  g.fillRect(0, 0, c.width, c.height);

  // Traces: a few buses from the USB end towards the chip, with vias.
  g.strokeStyle = C.edge;
  g.lineWidth = 7;
  g.lineJoin = "round";
  for (const [z0, z1, bend] of TRACES) {
    g.beginPath();
    g.moveTo(px(-1.6), pz(z0));
    g.lineTo(px(bend), pz(z0));
    g.lineTo(px(bend + 0.25), pz(z1));
    g.lineTo(px(CHIP_X - 0.3), pz(z1));
    g.stroke();
    g.fillStyle = C.edge;
    g.beginPath();
    g.arc(px(bend + 0.25), pz(z1), 11, 0, Math.PI * 2);
    g.fill();
  }

  // Pads around every header pin, and their labels beside them.
  const font = C.mono || "monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [side, z, labelZ] of [
    ["L", ROW_Z, ROW_Z - 0.2],
    ["R", -ROW_Z, -ROW_Z + 0.2],
  ] as const) {
    HEADER[side].forEach((name, i) => {
      g.fillStyle = C.pad;
      g.beginPath();
      g.arc(px(pinX(i)), pz(z), 0.085 * k, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = C.silk;
      g.font = `600 ${Math.round(0.07 * k)}px ${font}`;
      g.fillText(pinLabel(name).replace(/^(TX|RX) | OUT$/g, ""), px(pinX(i)), pz(labelZ));
    });
  }

  // Board markings.
  g.fillStyle = C.silk;
  g.font = `700 ${Math.round(0.14 * k)}px ${font}`;
  g.textAlign = "left";
  g.fillText("PULSAR C6", px(1.0), pz(-0.08));
  g.font = `500 ${Math.round(0.07 * k)}px ${font}`;
  g.fillStyle = C.silkDim;
  g.fillText("WiFi 6 · BLE 5 · 802.15.4", px(1.0), pz(0.14));
  g.fillStyle = C.silk;
  g.font = `700 ${Math.round(0.06 * k)}px ${font}`;
  g.textAlign = "center";
  g.fillText("BOOT", px(-1.4), pz(0.52));
  g.fillText("RST", px(-1.4), pz(-0.52));
  g.fillText("RGB", px(LED[0]), pz(LED[1] + 0.18));
  g.strokeStyle = C.silk;
  g.lineWidth = 3;
  g.strokeRect(px(LED[0]) - 0.13 * k, pz(LED[1]) - 0.13 * k, 0.26 * k, 0.26 * k);
  return tex;
}

// [from z, to z, where the bend is]
const TRACES: readonly (readonly [number, number, number])[] = [
  [0.15, 0.05, -1.3],
  [-0.15, -0.05, -1.25],
  [0.5, 0.15, 0.2],
  [-0.5, -0.15, 0.25],
];

/** The marking on top of the chip. */
function chipLabel(T: ThreeModule, C: Colours): Three.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const tex = new T.CanvasTexture(c);
  if (!g) return tex;
  g.fillStyle = C.plastic;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = C.silkDim;
  const font = C.mono || "monospace";
  g.textAlign = "center";
  g.font = `700 34px ${font}`;
  g.fillText("ESP32-C6", 128, 116);
  g.font = `600 30px ${font}`;
  g.fillText("FH4", 128, 160);
  g.beginPath();
  g.arc(36, 36, 12, 0, Math.PI * 2);
  g.fill();
  return tex;
}
