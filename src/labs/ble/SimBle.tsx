import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "@/widgets/types";
import { BLE_LABS } from "./screens";

/** B1-B8 preview: the lab's screen, its buttons and its serial monitor (example data). */
export function SimBle({ lesson }: WidgetProps) {
  const lab = BLE_LABS[lesson.id];
  if (!lab) return <Caption>Preview coming with this lab.</Caption>;
  return lab.preview(lesson);
}
