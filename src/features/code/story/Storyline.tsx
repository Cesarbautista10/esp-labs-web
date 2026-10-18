import type { CSSProperties } from "react";
import type { Story } from "@/domain/code/story";
import styles from "./story.module.css";
import { ACT_INFO } from "./narrate";

/**
 * The whole story at a glance: acts, and inside them the scenes indented by call depth, like a
 * table of contents of the program as it runs. Tap a scene to go there.
 */
export function Storyline({
  story,
  current,
  seen,
  onGo,
}: {
  story: Story;
  current: string | undefined;
  seen: ReadonlySet<string>;
  onGo: (index: number) => void;
}) {
  let n = 0;
  return (
    <nav className={styles.storyline} aria-label="Storyline">
      {story.acts.map((act) => (
        <section key={act.id} className={styles.act} data-act={act.id}>
          <h4 className={styles.actTitle}>{ACT_INFO[act.id].title}</h4>
          <p className={styles.actBlurb}>{ACT_INFO[act.id].blurb}</p>
          <ol className={styles.scenes}>
            {act.scenes.map((scene) => {
              const index = n++;
              return (
                <li key={scene.id} style={{ "--depth": scene.depth } as CSSProperties}>
                  <button
                    type="button"
                    aria-current={scene.id === current ? "step" : undefined}
                    data-seen={seen.has(scene.id) || undefined}
                    data-shared={scene.fn.role === "shared" || undefined}
                    onClick={() => onGo(index)}
                  >
                    <span className={styles.dot} aria-hidden="true" />
                    <code>{scene.fn.qualified}()</code>
                    <span className={styles.file}>{scene.fn.path.split("/").at(-1)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </nav>
  );
}
