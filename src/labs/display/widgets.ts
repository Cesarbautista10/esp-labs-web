import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the display lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const displayWidgets = {
  display: lazyWidget(placeholder, "Placeholder"),
  showcase: lazyWidget(placeholder, "Placeholder"),
  displayWiring: lazyWidget(placeholder, "Placeholder"),
  fullWiring: lazyWidget(placeholder, "Placeholder"),
  screenVsButton: lazyWidget(placeholder, "Placeholder"),
  buttonWiring: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
