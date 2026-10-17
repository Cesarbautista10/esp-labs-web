import { useState } from "react";
import type { ResolvedLesson } from "@/domain/lesson";
import { Button, ButtonRow } from "@/ui/Button";
import { Caption } from "@/ui/Caption";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { TerminalLog } from "@/ui/terminal/terminal-log";
import { useSimulation } from "../simulation";
import { ScreenCanvas } from "./ScreenCanvas";
import type { LabKit, LabState, ScreenSpec } from "./types";
import styles from "./LabScreen.module.css";

interface ScreenGalleryProps<S extends LabState, Spec extends ScreenSpec<S>> {
  kit: LabKit<S, Spec>;
  spec: Spec | undefined;
  lesson: ResolvedLesson;
  /** View to open first. */
  initialView?: number;
}

/** "What the screen shows": every view of the lab, one at a time, with a sentence each. */
export function ScreenGallery<S extends LabState, Spec extends ScreenSpec<S>>({
  spec,
  ...rest
}: ScreenGalleryProps<S, Spec>) {
  if (!spec) return <Caption>Coming with this lab.</Caption>;
  return <Gallery key={rest.lesson.id} spec={spec} {...rest} />;
}

// The gallery's buttons have no serial monitor to print to.
const SILENT = new TerminalLog();

function Gallery<S extends LabState, Spec extends ScreenSpec<S>>({
  kit,
  spec,
  lesson,
  initialView = 0,
}: ScreenGalleryProps<S, Spec> & { spec: Spec }) {
  const [sim, snapshot] = useSimulation(() => spec.init());
  const [view, setView] = useState(Math.min(initialView, spec.views.length - 1));

  return (
    <div className={styles.sim}>
      <ChoiceGroup
        label="Screen view"
        value={view}
        onChange={setView}
        choices={spec.views.map((v, i) => ({ key: i, label: `${i + 1} · ${v}` }))}
      />
      {kit.handActions ? (
        <ButtonRow>
          {kit.handActions.map((a, i) => (
            <Button key={i} onClick={() => sim.update((st) => a.run(st, SILENT))}>
              {typeof a.label === "function" ? a.label(snapshot.state) : a.label}
            </Button>
          ))}
        </ButtonRow>
      ) : null}
      <ScreenCanvas
        kit={kit}
        spec={spec}
        lesson={lesson}
        sim={sim}
        view={view}
        label={`Example of the ${spec.views[view]} view`}
      />
      <Caption live>{spec.captions?.[view] ?? ""}</Caption>
    </div>
  );
}
