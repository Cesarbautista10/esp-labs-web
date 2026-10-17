import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the sound lessons reference, each in its own chunk.
const placeholder = () => import("@/widgets/Placeholder");

export const soundWidgets = {
  sound: lazyWidget(placeholder, "Placeholder"),
  soundScreens: lazyWidget(placeholder, "Placeholder"),
  soundJourney: lazyWidget(placeholder, "Placeholder"),
  soundChain: lazyWidget(placeholder, "Placeholder"),
  soundMics: lazyWidget(placeholder, "Placeholder"),
  soundBias: lazyWidget(placeholder, "Placeholder"),
  soundComparator: lazyWidget(placeholder, "Placeholder"),
  soundDecibels: lazyWidget(placeholder, "Placeholder"),
  soundBallistics: lazyWidget(placeholder, "Placeholder"),
  soundClapMachine: lazyWidget(placeholder, "Placeholder"),
  soundRecorderTimeline: lazyWidget(placeholder, "Placeholder"),
  soundGetOut: lazyWidget(placeholder, "Placeholder"),
  soundFftExplainer: lazyWidget(placeholder, "Placeholder"),
  soundWhistleSeq: lazyWidget(placeholder, "Placeholder"),
  soundKnockMatcher: lazyWidget(placeholder, "Placeholder"),
  soundSpeakerPath: lazyWidget(placeholder, "Placeholder"),
  soundSynth: lazyWidget(placeholder, "Placeholder"),
  soundParrot: lazyWidget(placeholder, "Placeholder"),
} as const satisfies WidgetMap;
