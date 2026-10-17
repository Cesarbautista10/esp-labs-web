import { useEffect, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import type { WidgetProps } from "@/widgets/types";
import { browserAudio, type PlayingSound } from "../../audio/browser-audio";
import {
  canCapture,
  CaptureError,
  type CaptureFailure,
  captureVoice,
} from "../../audio/mic-capture";
import { useBrowserAudio } from "../../audio/use-browser-audio";
import { applyVoiceFx, cannedVoice, fxSpeed, VOICE_FX, type VoiceFx } from "../../model/voice-fx";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import shared from "../panel.module.css";
import { drawParrot, H } from "./parrot-draw";
import styles from "./parrot.module.css";

interface Voice {
  samples: Float32Array;
  rate: number;
}

interface ParrotSim {
  voice: Voice;
  /** The last voice + effect and what it produced, so a frame doesn't redo the effect. */
  shown: { voice: Voice; fx: VoiceFx; out: Float32Array } | null;
  playing: { sound: PlayingSound | null; at: number; dur: number; out: Float32Array } | null;
  /** performance.now() when the microphone opened, while recording. */
  recAt: number | null;
}

const FAILED: Readonly<Record<CaptureFailure, string>> = {
  unsupported: "No microphone access in this browser: the example voice works the same.",
  denied:
    "The microphone wasn't allowed (by you, the browser or this page's host). The example voice works the same.",
  unreadable: "Couldn't read that recording: the example voice is still here.",
};

/** S8 panel: the parrot, in your browser. Your microphone only opens on the record click. */
export function SoundParrot(_: WidgetProps) {
  useBrowserAudio();
  const [fx, setFx] = useState<VoiceFx>("chipmunk");
  const [recording, setRecording] = useState(false);
  const [caption, setCaption] = useState(
    "An example voice is loaded. Your own voice is optional: the microphone starts only when you press record, stops after 3 s, and the sound never leaves this page.",
  );
  const sim = useRef<ParrotSim | null>(null);
  // Aborted on unmount: stops a recording in progress and what the parrot is saying.
  const life = useRef<AbortController | null>(null);
  const get = () =>
    (sim.current ??= { voice: cannedVoice(), shown: null, playing: null, recAt: null });

  useEffect(() => {
    const ac = new AbortController();
    life.current = ac;
    ac.signal.addEventListener("abort", () => sim.current?.playing?.sound?.stop(), { once: true });
    return () => ac.abort();
  }, []);

  function play() {
    // A click: browser sound may start here.
    browserAudio.setOn(true);
    if (!browserAudio.start()) {
      setCaption("This browser has no Web Audio.");
      return;
    }
    const s = get();
    s.playing?.sound?.stop();
    const out = applyVoiceFx(s.voice.samples, s.voice.rate, fx);
    const speed = fxSpeed(fx);
    s.playing = {
      sound: browserAudio.samples(out, s.voice.rate, speed),
      at: performance.now(),
      dur: (out.length / s.voice.rate / speed) * 1000,
      out,
    };
  }

  async function record() {
    const s = get();
    const signal = life.current?.signal;
    if (s.recAt !== null || !signal) return;
    if (!canCapture()) {
      setCaption(FAILED.unsupported);
      return;
    }
    try {
      const voice = await captureVoice(
        3000,
        () => {
          s.recAt = performance.now();
          setRecording(true);
          setCaption("Recording from your microphone for 3 s… (the red dot shows it)");
        },
        signal,
      );
      s.voice = { samples: voice.samples, rate: voice.rate };
      setCaption(
        `Recorded ${voice.seconds.toFixed(1)} s, kept in this page only (made louder, like the board does). Pick a voice and press ▶.`,
      );
    } catch (error) {
      if (!signal.aborted)
        setCaption(FAILED[error instanceof CaptureError ? error.reason : "unreadable"]);
    } finally {
      s.recAt = null;
      if (!signal.aborted) setRecording(false);
    }
  }

  return (
    <CanvasPanel
      h={H}
      label="The recording on top and what the parrot plays below, with a playhead."
      caption={caption}
      controls={
        <>
          <ChoiceGroup
            label="Voice"
            value={fx}
            onChange={setFx}
            choices={VOICE_FX.map(([f]) => ({ key: f, label: f }))}
            className={styles.full}
          />
          <Button onClick={play}>▶ the parrot says it</Button>
          <Button onClick={() => void record()}>🎙 record 3 s with my microphone</Button>
          {recording ? <span className={shared.rec}>● REC</span> : null}
          <Button
            onClick={() => {
              get().voice = cannedVoice();
              setCaption("The example voice: two syllables made of harmonics shaped like vowels.");
            }}
          >
            use the example voice
          </Button>
        </>
      }
      onFrame={({ g, C }) => {
        const s = get();
        let { shown } = s;
        if (!shown || shown.voice !== s.voice || shown.fx !== fx)
          shown = s.shown = {
            voice: s.voice,
            fx,
            out: applyVoiceFx(s.voice.samples, s.voice.rate, fx),
          };
        const p = s.playing;
        let playhead: number | null = null;
        if (p) {
          const k = (performance.now() - p.at) / p.dur;
          if (k <= 1) playhead = k;
          else s.playing = null;
        }
        const speed = fxSpeed(fx);
        drawParrot(g, C, {
          heard: s.voice.samples,
          says: p ? p.out : shown.out,
          saysLabel: `what the parrot says (${fx}${speed !== 1 ? `, ×${speed} speed` : ""})`,
          playhead,
          recSecs: s.recAt !== null ? (performance.now() - s.recAt) / 1000 : null,
        });
      }}
    />
  );
}
