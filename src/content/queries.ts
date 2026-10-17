import { queryOptions } from "@tanstack/react-query";
import type { LessonEntry, TrackId } from "@/domain/lesson";

type LessonLoader = () => Promise<readonly LessonEntry[]>;

// One chunk per track: opening a Wi-Fi lesson never downloads the sound track's text.
const LOADERS: Partial<Record<TrackId, LessonLoader>> = {
  intro: () => import("./lessons/intro").then((m) => m.introLessons),
  display: () => import("./lessons/display").then((m) => m.displayLessons),
  wifi: () => import("./lessons/wifi").then((m) => m.wifiLessons),
  rfid: () => import("./lessons/rfid").then((m) => m.rfidLessons),
  ble: () => import("./lessons/ble").then((m) => m.bleLessons),
  sound: () => import("./lessons/sound").then((m) => m.soundLessons),
};

/** A track's lessons. Bundled content never changes while the page is open: static. */
export const trackLessonsQuery = (track: TrackId) =>
  queryOptions({
    queryKey: ["content", "lessons", track] as const,
    queryFn: () => LOADERS[track]?.() ?? Promise.resolve([]),
    staleTime: "static",
    gcTime: Infinity,
  });
