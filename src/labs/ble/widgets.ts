import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the ble lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const bleWidgets = {
  ble: lazyWidget(placeholder, "Placeholder"),
  bleJourney: lazyWidget(placeholder, "Placeholder"),
  bleRadio: lazyWidget(placeholder, "Placeholder"),
  bleAnatomy: lazyWidget(placeholder, "Placeholder"),
  bleScreens: lazyWidget(placeholder, "Placeholder"),
  b2Builder: lazyWidget(placeholder, "Placeholder"),
  b2Timing: lazyWidget(placeholder, "Placeholder"),
  b3Seq: lazyWidget(placeholder, "Placeholder"),
  b3Table: lazyWidget(placeholder, "Placeholder"),
  b4Matrix: lazyWidget(placeholder, "Placeholder"),
  b4Seq: lazyWidget(placeholder, "Placeholder"),
  b5Seq: lazyWidget(placeholder, "Placeholder"),
  b5Throughput: lazyWidget(placeholder, "Placeholder"),
  b6Report: lazyWidget(placeholder, "Placeholder"),
  b6Sound: lazyWidget(placeholder, "Placeholder"),
  b7Packet: lazyWidget(placeholder, "Placeholder"),
  b7Latency: lazyWidget(placeholder, "Placeholder"),
  b8Flow: lazyWidget(placeholder, "Placeholder"),
  b8Decoder: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
