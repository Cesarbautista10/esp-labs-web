import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { pickFlows } from "../flows";
import { B5_FLOWS } from "./b5-flows";

/** B5: one colour change, from JavaScript to the LED, and a notification back. */
export function B5Seq({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(B5_FLOWS, panel?.flows)}
      legend={[{ kind: "msg", label: "call, event or radio packet (orange: this step)" }]}
      waitLane={1}
    />
  );
}
