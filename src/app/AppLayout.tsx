import { NavLink, Outlet, ScrollRestoration, useNavigation } from "react-router";
import { BenchOverview } from "@/features/bench/BenchOverview";
import { ThemeSwitch } from "@/features/theme/ThemeSwitch";
import styles from "./AppLayout.module.css";

/** Header, bench status and the page. Shared by every route. */
export function AppLayout() {
  const navigation = useNavigation();
  return (
    <div className={styles.wrap}>
      {/* The hash router owns location.hash, so the skip link moves focus itself. */}
      <a
        className={styles.skip}
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      {navigation.state !== "idle" ? (
        <div className={styles.progress} role="progressbar" aria-label="Loading" />
      ) : null}
      <header className={styles.top}>
        <div>
          <p className={styles.eyebrow}>hardware-diary / test-esp</p>
          <h1>
            ESP32-S3 <span className={styles.part}>N16R8</span> bench guide
          </h1>
        </div>
        <div className={styles.side}>
          <p className={styles.spec} aria-label="Board specifications">
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
          <div className={styles.tools}>
            <nav aria-label="Sections" className={styles.sections}>
              <NavLink to="/lessons">Lessons</NavLink>
              <NavLink to="/log">Bench log</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>
            <ThemeSwitch />
          </div>
        </div>
      </header>
      <BenchOverview />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <p className={styles.foot}>
        Pin layout follows the Espressif DevKitC-1 v1.0. Clones are nearly identical, but the labels
        printed on your board always win. Your ticks are saved in this browser only.
      </p>
      <ScrollRestoration />
    </div>
  );
}
