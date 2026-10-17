import { useState } from "react";
import { Button } from "@/ui/Button";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { RichText } from "@/ui/RichText";
import type { WidgetProps } from "@/widgets/types";
import { CanvasPanel } from "../canvas-panel/CanvasPanel";
import { Spacer } from "../controls";
import panelStyles from "../panel.module.css";
import { drawGetOut, PATHS, type PathKey, WAV_HEADER } from "./get-out";
import styles from "./get-out.module.css";

const CHOICES: readonly { key: PathKey; label: string }[] = [
  { key: "phone", label: "📱 phone (Wi-Fi)" },
  { key: "usb", label: "🔌 USB (serial)" },
  { key: "board", label: "🔈 the board's speaker" },
];

/** S4 panel: getting the audio out, and what a WAV file is. */
export function SoundGetOut(_: WidgetProps) {
  const [path, setPath] = useState<PathKey>("phone");
  const [at, setAt] = useState(0);
  const steps = PATHS[path];
  const step = steps[at] ?? steps[0];
  if (!step) return null;
  const move = (d: number) => setAt((a) => (a + steps.length + d) % steps.length);

  return (
    <CanvasPanel
      h={150}
      label="The board, the phone and the Mac, with the message of the current step travelling between them."
      controls={
        <>
          <ChoiceGroup
            label="Path"
            value={path}
            onChange={(k) => {
              setPath(k);
              setAt(0);
            }}
            choices={CHOICES}
          />
          <Spacer />
          <Button aria-label="Previous step" onClick={() => move(-1)}>
            ◀
          </Button>
          <span className={panelStyles.mono}>
            {at + 1} / {steps.length}
          </span>
          <Button aria-label="Next step" onClick={() => move(1)}>
            ▶
          </Button>
        </>
      }
      caption={<RichText text={`<b>${at + 1}. ${step.t}</b> ${step.d}`} />}
      onFrame={({ g, C, t, reduce }) => drawGetOut(g, C, path, step, t, reduce)}
    >
      <ul className={styles.wav} aria-label="The 44-byte WAV header">
        {WAV_HEADER.map(([v, b, w], i) => (
          <li key={i} className={styles.bf}>
            <b>{v}</b>
            <code>{b}</code>
            <i>{w}</i>
          </li>
        ))}
      </ul>
    </CanvasPanel>
  );
}
