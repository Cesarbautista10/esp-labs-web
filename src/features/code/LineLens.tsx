import type { LineExplanation } from "@/domain/code/explain";
import type { GlossaryEntry } from "@/domain/code/glossary";
import { RichText } from "@/ui/RichText";
import styles from "./panels.module.css";
import { TermChips } from "./TermCard";

interface LineLensProps {
  line: number;
  text: string;
  explanation: LineExplanation;
  wordIds: readonly string[];
  entries: ReadonlyMap<string, GlossaryEntry>;
  onTerm: (id: string) => void;
  onLine: (line: number) => void;
  onJump: (path: string, line: number) => void;
  /** Shown in a tour: go back to the stop's explanation. */
  onBack?: () => void;
}

/** "What does this line do?": the plain sentence, the words on it, and where its names come from. */
export function LineLens({
  line,
  text,
  explanation,
  wordIds,
  entries,
  onTerm,
  onLine,
  onJump,
  onBack,
}: LineLensProps) {
  const { jump, continues } = explanation;
  return (
    <article className={styles.card} aria-label={`Line ${line + 1}`}>
      <p className={styles.eyebrow}>
        Line {line + 1}
        {onBack ? (
          <button type="button" className={styles.back} onClick={onBack}>
            ← back to the stop
          </button>
        ) : null}
      </p>
      <pre className={styles.lensCode}>{text.trim() || " "}</pre>
      <p className={styles.say}>
        {explanation.text ? (
          <RichText text={explanation.text} />
        ) : (
          "An empty line: it only gives the code room to breathe."
        )}
      </p>
      {continues !== undefined ? (
        <button type="button" className={styles.link} onClick={() => onLine(continues)}>
          Read from line {continues + 1}, where it starts →
        </button>
      ) : null}
      {jump ? (
        <button type="button" className={styles.link} onClick={() => onJump(jump.path, jump.line)}>
          See where <code>{jump.name}</code> is defined ({jump.path.split("/").at(-1)}, line{" "}
          {jump.line + 1}) →
        </button>
      ) : null}
      {wordIds.length ? (
        <div className={styles.fresh}>
          <p className={styles.freshLabel}>Words on this line</p>
          <TermChips ids={wordIds} entries={entries} onPick={onTerm} label="Words on this line" />
        </div>
      ) : null}
    </article>
  );
}
