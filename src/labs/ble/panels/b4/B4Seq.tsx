import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { pickFlows } from "../flows";
import { B4_FLOWS } from "./b4-flows";

/** B4: one pairing, packet by packet. */
export function B4Seq({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(B4_FLOWS, panel?.flows)}
      legend={[
        { kind: "msg", label: "SMP or link-layer packet (orange: this step)" },
        { kind: "wait", label: "waiting for a person" },
      ]}
      waitLane={2}
    />
  );
}
