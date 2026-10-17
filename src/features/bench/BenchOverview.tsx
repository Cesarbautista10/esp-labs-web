import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { benchStatusQuery } from "./queries";
import styles from "./BenchOverview.module.css";

/** "On the bench now": what is flashed, how the board is connected, what was verified. */
export function BenchOverview() {
  const { data, isPending, isError } = useQuery(benchStatusQuery());
  // Phones show only "On the board now" until you ask for the rest.
  const [expanded, setExpanded] = useState(false);

  if (isError) return null; // The guide works without it; the error is already logged.
  if (isPending)
    return <div className={styles.skeleton} aria-busy="true" aria-label="Loading bench status" />;

  return (
    <div className={styles.wrap} data-expanded={expanded}>
      <dl id="bench-overview" className={styles.overview} aria-label="On the bench now">
        {data.overview.map((item) => (
          <div key={item.label} className={item.highlight ? styles.now : undefined}>
            <dt>{item.label}</dt>
            <dd className={item.verified ? styles.verified : undefined}>
              {item.value}
              {item.detail ? <small>{item.detail}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className={styles.more}
        aria-expanded={expanded}
        aria-controls="bench-overview"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Less about the bench" : `More about the bench (${data.overview.length - 1})`}
      </button>
    </div>
  );
}
