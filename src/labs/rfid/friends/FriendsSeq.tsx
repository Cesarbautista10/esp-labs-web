import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { WidgetProps } from "@/widgets/types";
import { APP_LEGEND } from "../door/door-flows";
import { FRIENDS_FLOWS, friendsLive } from "./friends-flows";

/** R8 panel: one tap, and a new card getting a friend. */
export function FriendsSeq(_: WidgetProps) {
  return (
    <SequenceDiagram flows={FRIENDS_FLOWS} legend={APP_LEGEND} waitLane={0} live={friendsLive} />
  );
}
