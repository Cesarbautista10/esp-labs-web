import { type KeyboardEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { browserLanguages, localeChoiceStore, useLocaleChoice } from "@/i18n/locale-store";
import { LOCALE_INFO } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";
import { Icon } from "@/ui/Icon";
import { languageOptions } from "./language-options";
import styles from "./LanguageChoices.module.css";

/**
 * Settings' language picker: every language as a card, the way the page shows its other
 * choices. A radio group: one tab stop, arrow keys move and pick.
 */
export function LanguageChoices({ labelledBy }: { labelledBy: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const choice = useLocaleChoice();
  const group = useRef<HTMLDivElement>(null);
  const options = languageOptions(locale, browserLanguages());

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    // Left and right follow the reading direction.
    const sideways = e.key === "ArrowLeft" || e.key === "ArrowRight";
    const sign = sideways && LOCALE_INFO[locale].dir === "rtl" ? -1 : 1;
    const at = options.findIndex((o) => o.choice === choice);
    const next = options.at((at + step * sign) % options.length);
    if (!next) return;
    localeChoiceStore.set(next.choice);
    group.current?.querySelector<HTMLElement>(`[data-choice='${next.choice}']`)?.focus();
  };

  return (
    <div
      ref={group}
      className={styles.grid}
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {options.map((o) => {
        const checked = choice === o.choice;
        return (
          <button
            key={o.choice}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-choice={o.choice}
            className={styles.card}
            data-auto={o.choice === "auto" || undefined}
            onClick={() => localeChoiceStore.set(o.choice)}
            onKeyDown={onKey}
          >
            <span className={styles.top}>
              <span
                className={styles.native}
                lang={o.choice === "auto" ? undefined : LOCALE_INFO[o.locale].tag}
              >
                {o.choice === "auto" ? (
                  <>
                    <Icon name="globe" size={17} /> {t("language.auto")}
                  </>
                ) : (
                  o.native
                )}
              </span>
              {checked ? (
                <span className={styles.tick} aria-hidden="true">
                  <Icon name="check" size={15} stroke={2.6} />
                </span>
              ) : null}
            </span>
            <span className={styles.translated}>
              {o.choice === "auto" ? t("language.autoHint", { name: o.native }) : o.translated}
            </span>
          </button>
        );
      })}
    </div>
  );
}
