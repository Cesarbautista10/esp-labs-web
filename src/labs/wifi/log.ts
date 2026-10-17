import type { Tone } from "@/ui/terminal/terminal-log";

/** One line the pretend firmware prints on the serial monitor. */
export type LogLine = readonly [string, Tone];
