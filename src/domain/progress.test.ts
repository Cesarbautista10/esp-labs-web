import { describe, expect, it } from "vitest";
import type { LessonEntry } from "./lesson";
import { entryLesson, isLessonDone, isLessonWorking } from "./progress";

const lesson = (id: string, status: string, steps = ["one", "two"]): LessonEntry => ({
  kind: "lesson",
  id,
  track: "rfid",
  title: id,
  status,
  heading: id,
  steps,
});

describe("progress rules", () => {
  it("is done when every step is ticked", () => {
    expect(isLessonDone(lesson("R1", "built"), { "R1-0": true })).toBe(false);
    expect(isLessonDone(lesson("R1", "built"), { "R1-0": true, "R1-1": true })).toBe(true);
  });

  it("counts a lesson the board already runs as working", () => {
    expect(isLessonWorking(lesson("R1", "works on your board"), {})).toBe(true);
    expect(
      isLessonWorking(
        { kind: "planned", id: "W4", track: "wifi", title: "x", status: "planned" },
        {},
      ),
    ).toBe(false);
  });

  it("opens a track at its first lesson that isn't working yet", () => {
    const lessons = [
      lesson("R1", "works on your board"),
      lesson("R2", "built"),
      lesson("R3", "built"),
    ];
    expect(entryLesson(lessons, {})?.id).toBe("R2");
    expect(
      entryLesson(lessons, { "R2-0": true, "R2-1": true, "R3-0": true, "R3-1": true })?.id,
    ).toBe("R1");
  });
});
