import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { pickFlows } from "../flows";
import { B3_FLOWS } from "./b3-flows";

/** B3: from advert to conversation, step by step. */
export function B3Seq({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(B3_FLOWS, panel?.flows)}
      legend={[{ kind: "msg", label: "radio packet or call (orange: this step)" }]}
      waitLane={1}
    />
  );
}
