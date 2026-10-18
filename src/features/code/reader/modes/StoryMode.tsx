import { useEffect } from "react";
import { Link } from "react-router";
import { explainLine } from "@/domain/code/explain";
import { codeLines } from "@/domain/code/tour";
import { createLogger } from "@/lib/logger";
import { codeProgress, useEnvProgress } from "../../code-progress";
import { explainContext } from "../../lab-code";
import panel from "../../panels.module.css";
import { narrate } from "../../story/narrate";
import { StoryCard } from "../../story/StoryCard";
import { Storyline } from "../../story/Storyline";
import { storyOf } from "../../story/use-story";
import { LinePlayerControls } from "../LinePlayerControls";
import { ReaderFrame } from "../ReaderFrame";
import { useReader } from "../reader-context";
import styles from "../reader.module.css";
import { StepBar } from "../StepBar";
import { useArrowKeys } from "../use-arrow-keys";
import { useLinePlayer } from "../use-line-player";

const log = createLogger("code");

/**
 * The program as a story: start where the board starts, follow each call into whichever file
 * holds it, then do the same for loop(). The code pane follows the story from file to file.
 */
export function StoryMode() {
  const reader = useReader();
  const { lab, settings, simple } = reader;
  const story = storyOf(lab, settings.level);
  const progress = useEnvProgress(lab.env);
  const count = story.scenes.length;
  const index = Math.min(
    Math.max(0, Number(reader.params.get("scene") ?? "1") - 1 || 0),
    Math.max(0, count - 1),
  );
  const scene = story.scenes[index];
  const file = reader.file(scene?.fn.path ?? reader.params.get("file"));
  const span = scene ? { start: scene.fn.block.start, end: scene.fn.block.end } : null;
  const player = useLinePlayer(lab.env, file, span);

  // Reading a scene counts its lines as read, like a tour stop.
  useEffect(() => {
    if (!scene) return;
    codeProgress.visitScene(lab.env, scene.id);
    const lines = codeLines(file.analysis).filter(
      (l) => l >= scene.fn.block.start && l <= scene.fn.block.end,
    );
    codeProgress.readLines(lab.env, file.path, lines);
  }, [lab.env, scene, file]);

  const go = (i: number) => {
    reader.clearLine();
    reader.update((p) => p.set("scene", String(i + 1)));
  };
  const goScene = (id: string) => {
    const i = story.scenes.findIndex((s) => s.id === id);
    if (i >= 0) go(i);
  };
  const next = () => {
    if (index < count - 1) go(index + 1);
    else log.info("story finished", { env: lab.env, level: settings.level });
  };
  const prev = () => (index > 0 ? go(index - 1) : undefined);
  useArrowKeys(prev, next);

  if (!scene) {
    return (
      <ReaderFrame
        file={file}
        guide={
          <article className={panel.card}>
            <p className={panel.eyebrow}>Story</p>
            <h3 className={panel.title}>No story to follow here</h3>
            <p className={panel.say}>
              This code has no <code>setup()</code> and <code>loop()</code> to start from. Take the
              tour instead.
            </p>
          </article>
        }
        bar={null}
      />
    );
  }

  const seen = new Set(progress.scenes ?? []);
  const text = narrate(scene, lab, file);
  const ctx = explainContext(lab, file);
  const last = index === count - 1;

  return (
    <ReaderFrame
      file={file}
      spotlight={span}
      cursor={player.cursor}
      onPickFile={(path) => reader.switchMode("explore", { file: path })}
      map={{
        label: "Storyline",
        content: <Storyline story={story} current={scene.id} seen={seen} onGo={go} />,
      }}
      guide={
        <>
          <StoryCard
            key={scene.id}
            scene={scene}
            text={text}
            index={index}
            story={story}
            simple={simple}
            deep={settings.level === "deep"}
            onScene={goScene}
          >
            <LinePlayerControls
              player={player}
              explanation={player.cursor !== null ? explainLine(ctx, player.cursor).text : null}
            />
          </StoryCard>
          {last ? (
            <div className={styles.doneActions}>
              <p className={panel.say}>
                That is the whole story{settings.level !== "deep" ? " at this level" : ""}: you
                followed the program through {new Set(story.scenes.map((s) => s.fn.path)).size}{" "}
                files.
              </p>
              <Link className={styles.primary} to={reader.lessonHref}>
                Back to the lab
              </Link>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => reader.switchMode("explore")}
              >
                Explore on your own
              </button>
            </div>
          ) : null}
        </>
      }
      bar={
        <StepBar
          index={index}
          noun="scene"
          simple={simple}
          marks={story.scenes.map((s, i) => ({
            id: s.id,
            label: `${s.fn.qualified}()`,
            seen: seen.has(s.id),
            opens: i > 0 && s.act !== story.scenes[i - 1]?.act,
          }))}
          onGo={go}
          onPrev={prev}
          onNext={next}
        />
      }
    />
  );
}
