import { PartIcon } from "@/ui/parts/PartIcon";
import { PART_NAMES, PARTS } from "@/ui/parts/registry";
import styles from "./PartsPage.module.css";

/** The parts library at a glance: every illustration, its name in code and what it shows. */
export function PartsPage() {
  return (
    <section className={styles.page} aria-labelledby="parts-title">
      <header>
        <h2 id="parts-title">Parts library</h2>
        <p>
          Every part the labs use, drawn once and reused everywhere:{" "}
          <code>{'<PartIcon name="led" size={64} />'}</code>.
        </p>
      </header>
      <ul className={styles.grid}>
        {PART_NAMES.map((name) => (
          <li key={name}>
            <PartIcon name={name} size={96} />
            <code>{name}</code>
            <span>{PARTS[name].label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
