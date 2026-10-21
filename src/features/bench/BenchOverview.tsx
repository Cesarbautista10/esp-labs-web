import { useQuery } from "@tanstack/react-query";
import { BoardSpecs } from "./BoardSpecs";
import { benchStatusQuery } from "./queries";
import styles from "./BenchOverview.module.css";

/** "On the bench now": the board, what is flashed, how it is connected, what was verified. */
export function BenchOverview() {
  const { data, isPending, isError } = useQuery(benchStatusQuery());

  return (
    <section className={styles.wrap} aria-labelledby="bench-now">
      <div className={styles.head}>
        <h2 id="bench-now">On the bench now</h2>
        <BoardSpecs />
      </div>
      {isError ? null : isPending ? (
        <div className={styles.skeleton} aria-busy="true" aria-label="Loading bench status" />
      ) : (
        <dl className={styles.overview}>
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
      )}
    </section>
  );
}
