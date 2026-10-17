import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the rfid lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const rfidWidgets = {
  rfid: lazyWidget(placeholder, "Placeholder"),
  door: lazyWidget(placeholder, "Placeholder"),
  friends: lazyWidget(placeholder, "Placeholder"),
  rfidSpi: lazyWidget(placeholder, "Placeholder"),
  rfidScreens: lazyWidget(placeholder, "Placeholder"),
  rfidField3d: lazyWidget(placeholder, "Placeholder"),
  rfidSeq: lazyWidget(placeholder, "Placeholder"),
  rfidAnticoll: lazyWidget(placeholder, "Placeholder"),
  rfidMemory3d: lazyWidget(placeholder, "Placeholder"),
  rfidAccess: lazyWidget(placeholder, "Placeholder"),
  rfidValue: lazyWidget(placeholder, "Placeholder"),
  rfidEdge: lazyWidget(placeholder, "Placeholder"),
  doorRules: lazyWidget(placeholder, "Placeholder"),
  doorSeq: lazyWidget(placeholder, "Placeholder"),
  doorCopy: lazyWidget(placeholder, "Placeholder"),
  friendsCast: lazyWidget(placeholder, "Placeholder"),
  friendsSeq: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
