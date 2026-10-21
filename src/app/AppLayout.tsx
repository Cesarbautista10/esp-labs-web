import { Link, Outlet, ScrollRestoration, useLocation, useNavigation } from "react-router";
import { BenchPill } from "@/features/bench/BenchPill";
import { BackToTop } from "@/ui/BackToTop";
import { Icon, type IconName } from "@/ui/Icon";
import styles from "./AppLayout.module.css";

const SECTIONS: readonly { to: string; label: string; icon: IconName; match: RegExp }[] = [
  { to: "/", label: "Labs", icon: "board", match: /^\/($|lessons|tracks)/ },
  { to: "/log", label: "Bench", icon: "log", match: /^\/log/ },
  { to: "/settings", label: "Settings", icon: "sliders", match: /^\/settings/ },
];

/** A slim top bar, the page, and a footnote. Shared by every route. */
export function AppLayout() {
  const navigation = useNavigation();
  const { pathname } = useLocation();
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
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <Icon name="chip" size={20} />
          </span>
          <span>
            <span className={styles.eyebrow}>esp-labs</span>
            <span className={styles.name}>
              ESP32-S3 <span className={styles.part}>bench guide</span>
            </span>
          </span>
        </Link>
        <BenchPill />
        <nav aria-label="Sections" className={styles.sections}>
          {SECTIONS.map((s) => {
            const here = s.match.test(pathname);
            return (
              <Link
                key={s.to}
                to={s.to}
                aria-current={here ? (pathname === s.to ? "page" : "true") : undefined}
              >
                <Icon name={s.icon} size={17} />
                <span className={styles.navLabel}>{s.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <p className={styles.foot}>
        Pin layout follows the Espressif DevKitC-1 v1.0. Clones are nearly identical, but the labels
        printed on your board always win. Your ticks are saved in this browser only.{" "}
        <Link to="/parts">The parts library</Link>
      </p>
      <BackToTop />
      <ScrollRestoration />
    </div>
  );
}
