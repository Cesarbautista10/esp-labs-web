import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { BLE_LABS } from "./screens";

/** "What the screen shows": every view of the lab, one at a time, with a sentence each. */
export function BleScreens({ lesson, panel }: WidgetProps) {
  const lab = BLE_LABS[lesson.id];
  if (!lab) return <Caption>Coming with this lab.</Caption>;
  return lab.gallery(lesson, panel?.view);
}
