import { useRef, useState } from "react";
import { Button } from "@/ui/Button";
import type { WidgetProps } from "@/widgets/types";
import { browserAudio } from "../../audio/browser-audio";
import { useBrowserAudio } from "../../audio/use-browser-audio";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range } from "../controls";
import { drawSpeakerPath, volumeGain } from "./speaker-draw";

/** S7 panel: from numbers to a moving cone, volume, and the echo guard. */
export function SoundSpeakerPath(_: WidgetProps) {
  useBrowserAudio();
  const [vol, setVol] = useState(40);
  const loopT = useRef(0);
  const gain = volumeGain(vol);
  const db = gain > 0 ? 20 * Math.log10(gain) : -Infinity;

  // A click: the only place this panel switches browser sound on.
  const hear = () => {
    browserAudio.setOn(true);
    browserAudio.tone(440, 600, "sine", 0, [10, 50, 1, 80], Math.min(1, (vol / 100) ** 2 * 2.5));
  };

  return (
    <CanvasPanel
      h={400}
      label="Samples going to the MAX98357A over I2S, its fast on-off pulses whose width follows each sample, the speaker cone following their average; a volume curve; and a timeline of the echo guard muting the detectors while the speaker plays."
      controls={
        <>
          <Range
            label="volume"
            ariaLabel="Volume 0 to 100"
            min={0}
            max={100}
            value={vol}
            onChange={setVol}
            output={`${vol} → ×${gain.toFixed(2)} (${Number.isFinite(db) ? `${db.toFixed(1)} dB` : "silent"})`}
          />
          <Button onClick={hear}>🔈 hear 440 Hz at this volume</Button>
        </>
      }
      caption={`Volume ${vol}: every sample × ${gain.toFixed(2)} before it leaves. The amplifier's pulses are too fast for the cone, so it follows their average: the wave.`}
      onFrame={({ g, C, dt, t, reduce }) => {
        if (!reduce) loopT.current = (loopT.current + dt) % 6;
        drawSpeakerPath(g, C, vol, t, reduce ? 0.3 : t * 0.25, loopT.current);
      }}
    />
  );
}
