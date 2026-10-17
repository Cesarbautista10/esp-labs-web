// S4 panel: getting the audio out (phone, USB, the board's speaker), and what a WAV file is.
import type { ScopePalette } from "@/lib/canvas";
import { display, mono, textWriter } from "../../kit/draw";

export type PathKey = "phone" | "usb" | "board";
type Place = "phone" | "board" | "mac" | "speaker";

export interface PathStep {
  readonly t: string;
  /** Rich text: may carry <code> and <b>. */
  readonly d: string;
  readonly from: Place;
  readonly to: Place;
  readonly msg: string;
}

export const PATHS: Readonly<Record<PathKey, readonly PathStep[]>> = {
  phone: [
    {
      t: "Open the page",
      d: "Your phone opens <code>http://bench.local/</code>. The page itself is open, but holds no audio. Paste the admin token (serial <code>token</code>); it stays in this tab's sessionStorage only.",
      from: "phone",
      to: "board",
      msg: "GET /",
    },
    {
      t: "List the clips",
      d: "<code>GET /api/clips</code> with <code>Authorization: Bearer …</code>. Without the token: 401. Every audio route checks it.",
      from: "phone",
      to: "board",
      msg: "GET /api/clips",
    },
    {
      t: "Stream one clip",
      d: "<code>GET /api/clip?n=3</code>: the board sends the 44-byte header, then the samples straight from PSRAM in chunks, made louder (normalised, up to ×64) on the way. Never one big string in RAM.",
      from: "board",
      to: "phone",
      msg: "WAV, chunk by chunk",
    },
    {
      t: "Draw and play",
      d: "The page decodes the WAV (WebAudio), draws its shape on a canvas and plays it with a moving playhead. Live level and state arrive over the WebSocket <code>/ws</code>.",
      from: "phone",
      to: "phone",
      msg: "decodeAudioData",
    },
  ],
  board: [
    {
      t: "Pick a clip",
      d: "On the <b>clips</b> view a long press picks the next clip; or type <code>play 3</code> (any clip number), <code>play 3 0.7</code> for slower and deeper.",
      from: "mac",
      to: "board",
      msg: "play 3 0.7",
    },
    {
      t: "Louder, but not too loud",
      d: "The clip is made louder like the download, but at most ×16: a whisper on the KY-037 would otherwise come back as mostly hiss, at full volume.",
      from: "board",
      to: "board",
      msg: "gain = min(16, 29000 / peak)",
    },
    {
      t: "Out of I2S1",
      d: "The samples go to the MAX98357A at <code>speed</code> × their rate: 0.5 = half speed, an octave down. While it plays, the detectors are deaf (the echo guard); <code>rec</code> stops playback first, and <code>play</code> is refused while recording.",
      from: "board",
      to: "speaker",
      msg: "I2S1 → class D → cone",
    },
    {
      t: "From the phone too",
      d: "The page has <b>Play on board</b> and <b>Stop on board</b> per clip and a speed choice: <code>POST /api/play?n=3&speed=0.7</code> with the token; <code>/api/status</code> shows <code>playing</code> and <code>playProgress</code>.",
      from: "phone",
      to: "board",
      msg: "POST /api/play?n=3",
    },
  ],
  usb: [
    {
      t: "Close the monitor",
      d: "Only one program can hold the serial port. Close <code>pio device monitor</code> first.",
      from: "mac",
      to: "mac",
      msg: "",
    },
    {
      t: "Ask for clip n",
      d: "<code>uv run python tools/sound_pull.py /dev/cu.usbserial-A5069RR4 3</code> opens the port without resetting the board and types <code>send 3</code>.",
      from: "mac",
      to: "board",
      msg: "send 3",
    },
    {
      t: "Base64 lines",
      d: "The board answers <code>WAV-BEGIN 3 102444 clip-3.wav</code>, then the whole WAV as base64 text, 76 characters a line (serial is a text pipe), then <code>WAV-END &lt;crc32&gt;</code>. Nothing else is printed in between.",
      from: "board",
      to: "mac",
      msg: "UklGRiyQAQBXQVZF…",
    },
    {
      t: "Check and save",
      d: "The tool decodes, compares the byte count and the CRC-32, and writes <code>clip-3.wav</code>. 100 kB takes about 12 s at 115 200 baud.",
      from: "mac",
      to: "mac",
      msg: "CRC ok → clip-3.wav",
    },
  ],
};

/** The 44-byte WAV header: [value, bytes, meaning]. */
export const WAV_HEADER: readonly (readonly [string, string, string])[] = [
  ["RIFF", "52 49 46 46", "the file type"],
  ["size", "24 90 01 00", "102 436 = everything after this"],
  ["WAVE", "57 41 56 45", "a wave file"],
  ["fmt ", "66 6D 74 20", "the format chunk"],
  ["16", "10 00 00 00", "its length"],
  ["1", "01 00", "PCM: plain samples"],
  ["1", "01 00", "one channel (mono)"],
  ["16000", "80 3E 00 00", "samples a second"],
  ["32000", "00 7D 00 00", "bytes a second"],
  ["2", "02 00", "bytes per sample"],
  ["16", "10 00", "bits per sample"],
  ["data", "64 61 74 61", "the samples follow"],
  ["size", "00 90 01 00", "102 400 bytes = 3.2 s"],
];

const POS: Readonly<Record<Place, number>> = { board: 340, phone: 600, mac: 80, speaker: 600 };

export function drawGetOut(
  g: CanvasRenderingContext2D,
  C: ScopePalette,
  path: PathKey,
  s: PathStep,
  t: number,
  reduce: boolean,
): void {
  const T = textWriter(g);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 680, 150);
  const boxes: readonly (readonly [Place, string, string])[] = [
    ["board", "ESP32-S3", "clips in PSRAM"],
    ...(path === "board"
      ? ([
          ["mac", "you", "serial or button"],
          ["speaker", "MAX98357A", "+ speaker"],
        ] as const)
      : ([
          [
            path === "phone" ? "phone" : "mac",
            path === "phone" ? "phone" : "Mac",
            path === "phone" ? "browser" : "sound_pull.py",
          ],
        ] as const)),
  ];
  for (const [k, n, sub] of boxes) {
    const x = POS[k];
    const on = s.from === k || s.to === k;
    g.strokeStyle = on ? C.pink : C.dim;
    g.lineWidth = on ? 2 : 1;
    g.beginPath();
    g.roundRect(x - 60, 40, 120, 60, 9);
    g.stroke();
    g.lineWidth = 1;
    T(x, 66, n, C.ink, display(13), "center");
    T(x, 86, sub, C.muted, mono(10), "center");
  }
  if (s.from !== s.to) {
    const a = POS[s.from];
    const b = POS[s.to];
    const k = reduce ? 0.5 : (t * 0.6) % 1;
    g.strokeStyle = C.dim;
    g.beginPath();
    g.moveTo(a, 120);
    g.lineTo(b, 120);
    g.stroke();
    g.fillStyle = C.pink;
    g.beginPath();
    g.arc(a + (b - a) * k, 120, 5, 0, 7);
    g.fill();
    T((a + b) / 2, 140, s.msg, C.ink, mono(11), "center");
  } else if (s.msg) T(POS[s.from], 130, s.msg, C.ink, mono(11), "center");
  T(
    10,
    20,
    path === "phone"
      ? "Every audio route needs the token · the board shows REC whoever starts it"
      : path === "board"
        ? "The board plays it itself: no phone, no cable"
        : "No Wi-Fi needed · the board's USB serial port, 115 200 baud",
    C.muted,
    mono(10),
  );
}
