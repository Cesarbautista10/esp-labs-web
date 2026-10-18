import type { Block } from "@/domain/code/analyze";
import styles from "./panels.module.css";
import type { CodeFile, LabCode } from "./lab-code";

const KIND_LABEL: Partial<Record<Block["kind"], string>> = {
  function: "function",
  struct: "struct",
  class: "class",
  enum: "enum",
};

/**
 * The shape of the program before the details: how it runs (setup once, loop forever, and what
 * each calls), then this file's sections and the functions and types in them.
 */
export function CodeMap({
  lab,
  file,
  onGo,
}: {
  lab: LabCode;
  file: CodeFile;
  onGo: (path: string, line: number) => void;
}) {
  const main = lab.files[0];
  const entry = (name: string) =>
    main?.analysis.blocks.find((b) => b.kind === "function" && b.depth === 0 && b.name === name);
  const setup = entry("setup");
  const loop = entry("loop");
  const ours = (calls: readonly string[]) =>
    calls.filter((c) => lab.defined.get(c)?.kind === "function");
  const go = (name: string) => {
    const def = lab.defined.get(name);
    if (def) onGo(def.path, def.line);
  };

  const named = file.analysis.blocks.filter((b) => KIND_LABEL[b.kind] && b.name);
  const chapters = [...file.analysis.chapters];
  const chapterOf = (line: number) => chapters.filter(([at]) => at < line).at(-1)?.[1];
  const sections = new Map<string, Block[]>();
  for (const b of named) {
    const key = chapterOf(b.start) ?? "";
    sections.set(key, [...(sections.get(key) ?? []), b]);
  }

  return (
    <div className={styles.map}>
      {setup && loop && main ? (
        <section aria-labelledby="map-run">
          <h3 id="map-run" className={styles.mapTitle}>
            How it runs
          </h3>
          <ol className={styles.run}>
            <li className={styles.runStep} data-kind="once">
              <button
                type="button"
                className={styles.runName}
                onClick={() => onGo(main.path, setup.start)}
              >
                setup()
              </button>
              <span className={styles.runWhen}>once, at power-up</span>
              <CallList calls={ours(setup.calls)} onGo={go} />
            </li>
            <li className={styles.runStep} data-kind="loop">
              <button
                type="button"
                className={styles.runName}
                onClick={() => onGo(main.path, loop.start)}
              >
                loop()
              </button>
              <span className={styles.runWhen}>
                <span className={styles.spin} aria-hidden="true">
                  ↻
                </span>{" "}
                forever, thousands of times a second
              </span>
              <CallList calls={ours(loop.calls)} onGo={go} />
            </li>
          </ol>
          {setup.calls.length + loop.calls.length > 0 &&
          ours([...setup.calls, ...loop.calls]).length === 0 ? (
            <p className={styles.hint}>
              The work happens in shared code: <code>setup()</code> and <code>loop()</code> hand
              over to a ready-made lab shell. Open the files under “Behind the scenes” to see it.
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="map-file">
        <h3 id="map-file" className={styles.mapTitle}>
          In {file.name}
        </h3>
        {named.length === 0 ? (
          <p className={styles.hint}>No functions or types here: just settings and includes.</p>
        ) : null}
        {[...sections].map(([chapter, blocks]) => (
          <div key={chapter || "top"} className={styles.mapSection}>
            {chapter ? <p className={styles.mapChapter}>{chapter}</p> : null}
            <ul className={styles.outline}>
              {blocks.map((b) => (
                <li
                  key={`${b.kind}-${b.start}`}
                  style={{ paddingInlineStart: `${Math.max(0, b.depth - 1) * 12}px` }}
                >
                  <button type="button" onClick={() => onGo(file.path, b.start)}>
                    <span className={styles.kind} data-kind={b.kind}>
                      {KIND_LABEL[b.kind]}
                    </span>
                    <code>
                      {b.name.split("::").at(-1)}
                      {b.kind === "function" ? "()" : ""}
                    </code>
                    <span className={styles.at}>{b.end - b.start + 1} lines</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function CallList({ calls, onGo }: { calls: readonly string[]; onGo: (name: string) => void }) {
  if (!calls.length) return null;
  return (
    <ul className={styles.calls} aria-label="Calls">
      {calls.map((c) => (
        <li key={c}>
          <button type="button" onClick={() => onGo(c)}>
            <code>{c}()</code>
          </button>
        </li>
      ))}
    </ul>
  );
}
