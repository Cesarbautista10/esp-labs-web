import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the intro lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const introWidgets = {
  usb: lazyWidget(placeholder, "Placeholder"),
  hello: lazyWidget(placeholder, "Placeholder"),
  led: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
