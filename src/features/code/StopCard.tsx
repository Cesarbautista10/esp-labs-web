import { type ReactNode, useState } from "react";
import type { GlossaryEntry } from "@/domain/code/glossary";
import type { TourStop } from "@/domain/code/tour";
import type { Level } from "@/features/settings/settings";
import { RichText } from "@/ui/RichText";
import styles from "./panels.module.css";
import { TermChips } from "./TermCard";

interface StopCardProps {
  stop: TourStop;
  index: number;
  count: number;
  level: Level;
  guessFirst: boolean;
  /** Words in these lines you have not met before. */
  freshIds: readonly string[];
  entries: ReadonlyMap<string, GlossaryEntry>;
  onTerm: (id: string) => void;
  /** Simple view: the precise story is left out and the programmer's note folds away. */
  simple?: boolean;
  /** The line-by-line player for this stop. */
  children?: ReactNode;
}

/**
 * The explanation of one tour stop. With "Guess first" on, it asks before it tells: a quiz when
 * the stop has one, otherwise a moment to read the lit lines. Keyed by stop id, so it resets.
 */
export function StopCard({
  stop,
  index,
  count,
  level,
  guessFirst,
  freshIds,
  entries,
  onTerm,
  simple = false,
  children,
}: StopCardProps) {
  const [revealed, setRevealed] = useState(!guessFirst);
  const [choice, setChoice] = useState<number | null>(null);
  const lines = stop.end - stop.start + 1;

  return (
    <article className={styles.card} aria-labelledby={`stop-${index}`}>
      <p className={styles.eyebrow}>
        Stop {index + 1} of {count}
        {stop.chapter ? <span className={styles.chapter}> · {stop.chapter}</span> : null}
        <span className={styles.range}>
          {" "}
          · line{lines > 1 ? `s ${stop.start + 1}–${stop.end + 1}` : ` ${stop.start + 1}`}
        </span>
      </p>
      <h3 id={`stop-${index}`} className={styles.title}>
        {stop.title}
      </h3>

      {!revealed ? (
        stop.quiz ? (
          <div className={styles.guess}>
            <p className={styles.guessAsk}>
              <span className={styles.badge}>Guess first</span>{" "}
              <RichText text={stop.quiz.question} />
            </p>
            <div className={styles.options} role="group" aria-label="Your guess">
              {stop.quiz.options.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  className={styles.option}
                  data-result={
                    choice === null
                      ? undefined
                      : i === stop.quiz?.answer
                        ? "right"
                        : i === choice
                          ? "wrong"
                          : undefined
                  }
                  disabled={choice !== null}
                  onClick={() => setChoice(i)}
                >
                  <RichText text={o} />
                </button>
              ))}
            </div>
            {choice !== null ? (
              <div className={styles.verdict} role="status">
                <b>{choice === stop.quiz.answer ? "Yes, well spotted." : "Not quite."}</b>{" "}
                <RichText text={stop.quiz.why} />
                <button type="button" className={styles.reveal} onClick={() => setRevealed(true)}>
                  Read the explanation
                </button>
              </div>
            ) : (
              <button type="button" className={styles.skip} onClick={() => setRevealed(true)}>
                Skip the guess
              </button>
            )}
          </div>
        ) : (
          <div className={styles.guess}>
            <p className={styles.guessAsk}>
              <span className={styles.badge}>Your turn</span> Read the lit{" "}
              {lines > 1 ? "lines" : "line"} first. What do you think{" "}
              {lines > 1 ? "they do" : "it does"}?
            </p>
            <button type="button" className={styles.reveal} onClick={() => setRevealed(true)}>
              Show me
            </button>
          </div>
        )
      ) : (
        <div className={styles.revealBody}>
          <p className={styles.say}>
            <RichText text={stop.say} />
          </p>
          {stop.note ? (
            simple ? (
              <details className={styles.more}>
                <summary>The programmer's note</summary>
                <blockquote className={styles.noteQuote}>{stop.note}</blockquote>
              </details>
            ) : (
              <figure className={styles.note}>
                <figcaption>The programmer's note</figcaption>
                <blockquote>{stop.note}</blockquote>
              </figure>
            )
          ) : null}
          {stop.deep && !simple ? (
            level === "deep" ? (
              <p className={styles.deep}>
                <RichText text={stop.deep} />
              </p>
            ) : (
              <details className={styles.more}>
                <summary>The precise story</summary>
                <p>
                  <RichText text={stop.deep} />
                </p>
              </details>
            )
          ) : null}
        </div>
      )}

      {freshIds.length ? (
        <div className={styles.fresh}>
          <p className={styles.freshLabel}>New words here</p>
          <TermChips
            ids={freshIds}
            entries={entries}
            onPick={onTerm}
            label="New words in this stop"
          />
        </div>
      ) : null}

      {children}
    </article>
  );
}
