import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { pickFlows, RFID_FLOWS, RFID_LEGEND } from "./rfid-flows";

/** R2/R4/R5 panel: one exchange step by step; `panel.flows` picks which. */
export function RfidSeq({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(RFID_FLOWS, panel?.flows)}
      legend={RFID_LEGEND}
      waitLane={0}
    />
  );
}
