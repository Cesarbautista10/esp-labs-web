import { Trans, useTranslation } from "react-i18next";
import styles from "./BenchOverview.module.css";

/** The board on the bench, in six numbers. */
const SPECS = ["chip", "cores", "flash", "radio", "mesh", "logic"] as const;

export function BoardSpecs() {
  const { t } = useTranslation("bench");
  return (
    <p className={styles.spec} aria-label={t("specs.label")}>
      {SPECS.map((spec) => (
        <span key={spec}>
          <Trans t={t} i18nKey={`specs.${spec}`} components={{ b: <b /> }} />
        </span>
      ))}
    </p>
  );
}
