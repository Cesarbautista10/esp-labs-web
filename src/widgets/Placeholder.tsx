import { Caption } from "@/ui/Caption";
import type { WidgetProps } from "./types";

/** Stands in for a widget that has no React port yet. */
export function Placeholder({ panel }: WidgetProps) {
  return (
    <Caption>{panel ? "This panel" : "This preview"} is not ported to the React guide yet.</Caption>
  );
}
