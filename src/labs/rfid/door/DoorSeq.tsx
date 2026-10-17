import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { APP_LEGEND, DOOR_FLOWS, doorLive } from "./door-flows";

/** R7 panel: a tap, a block, a copy and a new card, message by message. */
export function DoorSeq(_: WidgetProps) {
  return <SequenceDiagram flows={DOOR_FLOWS} legend={APP_LEGEND} waitLane={0} live={doorLive} />;
}
