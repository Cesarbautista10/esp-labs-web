// What every sound lab shares, as one LabKit: the status bar, the pretend microphone stepping every
// frame, the hands and voice buttons, the mic and browser-sound toggles, the shell and the boot.
import type { LabAction, LabKit } from "@/labs/shared/lab-screen/types";
import { browserAudio } from "../audio/browser-audio";
import { Mic, type MicOptions } from "../model/mic";
import { drawSoundChrome } from "./chrome";
import { soundNote } from "./note";
import { micLine, micName, printSoundHelp, soundShell, switchMic } from "./shell";
import type { SoundSpec, SoundState } from "./types";

/** A pretend microphone whose speaker plays through the browser (once you switch sound on). */
export const soundMic = (o: MicOptions = {}) => new Mic({ out: browserAudio, ...o });

/** Sound buttons every preview shares: the things your hands and voice do. */
export const SOUND_HANDS: readonly LabAction<SoundState>[] = [
  { label: "👏 clap", run: (st) => st.mic.clap() },
  {
    label: "👏👏 two claps",
    run: (st) => {
      st.mic.clap();
      st.mic.clap(0.3);
    },
  },
  { label: "🗣 talk 3 s", run: (st) => st.mic.say("talk", 3) },
  { label: "〰 whistle 3 s", run: (st) => st.mic.say("whistle", 3) },
  {
    label: "🤫 silence",
    run: (st) => {
      st.mic.say("quiet");
      st.mic.claps = [];
    },
  },
];

const PREVIEW_CAPTION =
  "A pretend microphone and speaker, drawn like the board does. The buttons stand in for your hands, your voice, the push button and the serial monitor; a click on the screen is a clap. Browser sound stays off until you switch it on.";

/** The sound track's kit for a lab whose state is S. */
export function soundKit<S extends SoundState>(): LabKit<S, SoundSpec<S>> {
  return {
    firmware: "sound-lab",
    previewCaption: PREVIEW_CAPTION,
    chrome: drawSoundChrome,
    step(st, dt) {
      st.mic.step(dt);
      st.doLamp = st.mic.takeDo();
    },
    handActions: SOUND_HANDS,
    trailingActions: () => [
      {
        label: (st) => (st.mic.digital ? "mic: INMP441 → KY-037" : "mic: KY-037 → INMP441"),
        run: (st, term) => switchMic(st, term, st.mic.digital ? "ky037" : "inmp441"),
      },
      {
        label: () => `🔈 hear it in the browser: ${browserAudio.isOn() ? "on" : "off"}`,
        pressed: () => browserAudio.isOn(),
        // A click: the only place the AudioContext may be created.
        run: () => browserAudio.setOn(!browserAudio.isOn()),
      },
    ],
    // Panels (synth, speaker path, parrot) can switch browser sound too: keep the label honest.
    subscribe: (changed) => browserAudio.subscribe(changed),
    bootLines: (st) => [
      ["Listening for an INMP441 on the I2S pins...", "plain"],
      [`Microphone: ${micName(st.mic)} (mic setting: auto)`, "plain"],
      [micLine(st.mic), "info"],
    ],
    afterBoot(st, term, lesson, spec) {
      printSoundHelp(lesson, spec, term, st);
      st.mic.spk.play(500, 523, "hello");
      soundNote(st, term, "-", "learning the quiet...");
    },
    shell: soundShell,
    onTap: (st) => st.mic.clap(),
    tapHint: "Click or press Space to clap",
    start(st, term) {
      st.term = term;
      const release = browserAudio.retain();
      return () => {
        clearInterval(st.plotTimer);
        st.plotTimer = undefined;
        st.term = undefined;
        release();
      };
    },
  };
}
