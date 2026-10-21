import styles from "./BenchOverview.module.css";

/** The board on the bench, in five numbers. */
export function BoardSpecs() {
  return (
    <p className={styles.spec} aria-label="Board specifications">
      <span>
        ESP32-S3 <b>N16R8</b>
      </span>
      <span>
        <b>2×</b> Xtensa LX7 @ 240 MHz
      </span>
      <span>
        <b>16 MB</b> flash
      </span>
      <span>
        <b>8 MB</b> octal PSRAM
      </span>
      <span>
        <b>Wi-Fi 4</b> + BLE 5
      </span>
      <span>
        <b>3.3 V</b> logic
      </span>
    </p>
  );
}
