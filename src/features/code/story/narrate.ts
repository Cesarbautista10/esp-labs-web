import { explainLine } from "@/domain/code/explain";
import type { ActId, Scene } from "@/domain/code/story";
import { commentText, type TourStop } from "@/domain/code/tour";
import type { Rich } from "@/domain/lesson";
import { explainContext, type CodeFile, type LabCode } from "../lab-code";

// Words for a scene: where we are in the program, why we got here, and what the code does.
// Pure, so the wording can be tested and improved without touching the screen.

export const ACT_INFO: Readonly<Record<ActId, { title: string; blurb: string }>> = {
  start: { title: "Power on", blurb: "What runs once, when the board starts." },
  forever: { title: "Again and again", blurb: "What loop() repeats, thousands of times a second." },
  more: {
    title: "When asked",
    blurb: "Code that runs when something calls it: a view, a command, a handler.",
  },
};

export interface SceneText {
  readonly title: string;
  /** Why we are here: who called this, from where. */
  readonly lead: Rich;
  /** What the function does. */
  readonly say: Rich;
  readonly note?: string;
  readonly deep?: Rich;
}

const code = (s: string) => `<code>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code>`;
const call = (qualified: string) => code(`${qualified}()`);
const fileName = (path: string) => path.split("/").at(-1) ?? path;

/** The hand-written tour stop about this function, if one starts at (or just above) its header. */
function writtenStopFor(file: CodeFile, scene: Scene): TourStop | undefined {
  const b = scene.fn.block;
  return file.stops.find(
    (s) =>
      s.source === "written" &&
      s.start <= b.start &&
      s.end >= b.open &&
      s.end <= b.end + 2 &&
      b.start - s.start <= 12,
  );
}

/** The comment written right above the function, if any. */
function noteAbove(file: CodeFile, scene: Scene): string | undefined {
  const { kinds, chapters } = file.analysis;
  const end = scene.fn.block.start - 1;
  let start = end;
  while (start >= 0 && kinds[start] === "comment" && !chapters.has(start)) start--;
  return start < end ? commentText(file.analysis, start + 1, end) || undefined : undefined;
}

function leadFor(scene: Scene, lab: LabCode): Rich {
  const { fn, trail, act } = scene;
  const parent = trail.at(-1);
  if (!parent) {
    if (act === "start" && fn.name === "setup")
      return `The board has just powered up. The first code it runs is ${call("setup")}, once.`;
    if (act === "forever" && fn.name === "loop")
      return `Set-up is done. From now on the board runs ${call("loop")} over and over, as fast as it can.`;
    const callers = lab.symbols.callers(fn);
    return callers.length
      ? `Not reached from ${call("setup")} or ${call("loop")} directly: ${callers
          .slice(0, 3)
          .map((c) => call(c.qualified))
          .join(", ")} ${callers.length === 1 ? "uses" : "use"} it.`
      : `Nothing calls ${call(fn.qualified)} by name: it is handed over as a value (a view to draw, a command to run, a handler), and runs when that moment comes.`;
  }
  const line = scene.calledAt
    ? ` on line ${scene.calledAt.line + 1} of ${code(fileName(scene.calledAt.path))}`
    : "";
  const moved = parent.path !== fn.path;
  const where = moved
    ? ` That code lives in another file, ${code(fileName(fn.path))}${fn.role === "shared" ? ", shared by several labs" : ""}.`
    : "";
  return `${call(parent.qualified)} calls ${call(fn.qualified)}${line}.${where}`;
}

export function narrate(scene: Scene, lab: LabCode, file: CodeFile): SceneText {
  const stop = writtenStopFor(file, scene);
  const header = explainLine(explainContext(lab, file), scene.fn.block.start).text;
  const note = noteAbove(file, scene);
  const title =
    scene.depth === 0 && scene.fn.name === "setup"
      ? "Power on: setup()"
      : scene.depth === 0 && scene.fn.name === "loop"
        ? "Forever: loop()"
        : (stop?.title ?? `${scene.fn.qualified}()`);
  return {
    title,
    lead: leadFor(scene, lab),
    say: stop?.say ?? header,
    ...(note ? { note } : {}),
    ...(stop?.deep ? { deep: stop.deep } : {}),
  };
}
