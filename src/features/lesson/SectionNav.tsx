import { useEffect, useRef } from "react";
import type { LessonSection } from "@/domain/lesson-sections";
import { goToSection } from "@/lib/active-section";
import { Icon } from "@/ui/Icon";
import { SECTION_ICON } from "./section-icons";
import styles from "./SectionNav.module.css";

/** Jump links to the parts of a long lesson; the one you are reading is lit. */
export function SectionNav({
  sections,
  active,
  steps,
}: {
  sections: readonly LessonSection[];
  active?: string;
  /** Ticked and total steps, shown on the Steps chip. */
  steps: { ticked: number; total: number };
}) {
  const navRef = useRef<HTMLElement>(null);

  // On a phone the chips scroll sideways: keep the lit one in view as you read down the page.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !chip) return;
    const left = chip.offsetLeft; // the nav is the offset parent (position: relative)
    if (left < nav.scrollLeft || left + chip.offsetWidth > nav.scrollLeft + nav.clientWidth)
      nav.scrollTo({ left: Math.max(0, left - 24) });
  }, [active]);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="On this page">
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={styles.chip}
              aria-current={s.id === active ? "location" : undefined}
              data-kind={s.kind}
              onClick={() => goToSection(s.id)}
            >
              <Icon name={SECTION_ICON[s.kind]} size={15} />
              {s.short}
              {s.kind === "steps" && steps.total ? (
                <span
                  className={styles.count}
                  data-complete={steps.ticked === steps.total || undefined}
                >
                  {steps.ticked}/{steps.total}
                </span>
              ) : null}
            </button>
          </li>
        ))}
        <li className={styles.phoneOnly}>
          <button
            type="button"
            className={styles.chip}
            aria-current={active === "sec-board" ? "location" : undefined}
            onClick={() => goToSection("sec-board")}
          >
            <Icon name={SECTION_ICON.board} size={15} />
            Pinout
          </button>
        </li>
      </ul>
    </nav>
  );
}
