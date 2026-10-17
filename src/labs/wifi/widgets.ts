import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the wifi lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const wifiWidgets = {
  wifi: lazyWidget(placeholder, "Placeholder"),
  phone: lazyWidget(placeholder, "Placeholder"),
  weather: lazyWidget(placeholder, "Placeholder"),
  wifiScan: lazyWidget(placeholder, "Placeholder"),
  webConcepts: lazyWidget(placeholder, "Placeholder"),
  remoteConcepts: lazyWidget(placeholder, "Placeholder"),
  httpsFlow: lazyWidget(placeholder, "Placeholder"),
  wifiRoadmap: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
