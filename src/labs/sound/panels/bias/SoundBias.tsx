import { useState } from "react";
import type { WidgetProps } from "@/widgets/types";
import { type Atten, attenName } from "../../model/level";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Range, Select } from "../controls";
import { drawBias } from "./bias-draw";

const ATTENS: readonly (readonly ["12" | "6" | "2.5" | "0", string])[] = [
  ["12", "atten 12 dB"],
  ["6", "atten 6 dB"],
  ["2.5", "atten 2.5 dB"],
  ["0", "atten 0 dB"],
];

const ATTEN_OF: Readonly<Record<"12" | "6" | "2.5" | "0", Atten>> = {
  "12": 12,
  "6": 6,
  "2.5": 2.5,
  "0": 0,
};

/** 0.5 mV (hush) .. ~270 mV (bang). */
const ampMv = (slider: number) => Math.round(0.5 * Math.pow(1.065, slider) * 10) / 10;

/** S1 panel: move the bias and the loudness, change the attenuation; outside the range, clipping. */
export function SoundBias(_: WidgetProps) {
  const [bias, setBias] = useState(1450);
  const [amp, setAmp] = useState(30);
  const [atten, setAtten] = useState<"12" | "6" | "2.5" | "0">("12");
  const a = ampMv(amp);

  return (
    <CanvasPanel
      h={260}
      label="A 0 to 3.3 volt ruler with the ADC's range shaded, the bias line and the microphone's wave; parts outside the range are clipped."
      controls={
        <>
          <Range
            label="bias"
            ariaLabel="Bias voltage in millivolts"
            min={100}
            max={3200}
            step={10}
            value={bias}
            onChange={setBias}
            output={`${bias} mV`}
          />
          <Range
            label="sound"
            ariaLabel="How loud: wave height"
            min={0}
            max={100}
            value={amp}
            onChange={setAmp}
            output={`±${a} mV`}
          />
          <Select ariaLabel="Attenuation" value={atten} options={ATTENS} onChange={setAtten} />
        </>
      }
      onFrame={({ g, C, t, reduce, caption }) => {
        const at = ATTEN_OF[atten];
        drawBias(g, C, bias, a, at, reduce ? 0.5 : t);
        caption(
          `Bias ${bias} mV, sound ±${a} mV, attenuation ${attenName(at)}. The hint is the same one S1's bias view prints on the board.`,
        );
      }}
    />
  );
}
