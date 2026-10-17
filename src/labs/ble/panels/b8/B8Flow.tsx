import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { pickFlows } from "../flows";
import { B8_FLOWS } from "./b8-flows";

/** B8: from scan to keystroke, step by step. */
export function B8Flow({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(B8_FLOWS, panel?.flows)}
      legend={[
        { kind: "msg", label: "packet on the air (orange: this step)" },
        { kind: "wait", label: "the board waiting for you" },
      ]}
      waitLane={0}
    />
  );
}
