import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { browserLanguages, localeChoiceStore, useLocaleChoice } from "@/i18n/locale-store";
import { LOCALE_INFO, type LocaleChoice } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";
import { Icon } from "@/ui/Icon";
import { languageOptions } from "./language-options";
import styles from "./LanguageMenu.module.css";

/**
 * The top bar's language button: the language on screen at a glance, a short menu to change it.
 * A menu button pattern: arrows move through the languages, Enter picks, Escape or a click
 * outside closes, and focus goes back to the button.
 */
export function LanguageMenu() {
  const { t } = useTranslation();
  const locale = useLocale();
  const choice = useLocaleChoice();
  // Open on one page only: following a link closes the menu without an effect.
  const { key: page } = useLocation();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === page;
  const setOpen = (next: boolean) => setOpenOn(next ? page : null);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const options = languageOptions(locale, browserLanguages());

  useEffect(() => {
    if (!open) return;
    // Start on the language in use, so Enter keeps it and the arrows step from there.
    list.current?.querySelector<HTMLElement>("[aria-checked='true']")?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const pick = (next: LocaleChoice) => {
    localeChoiceStore.set(next);
    close();
  };
  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[role='menuitemradio']") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      items.at(i % items.length)?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(-1);
    else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={root}>
      <button
        ref={button}
        type="button"
        className={styles.button}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={t("language.button", { name: LOCALE_INFO[locale].nativeName })}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Icon name="globe" size={17} />
        <span lang={LOCALE_INFO[locale].tag}>{LOCALE_INFO[locale].short}</span>
      </button>
      {open ? (
        <ul
          ref={list}
          id={id}
          role="menu"
          aria-label={t("language.label")}
          className={styles.menu}
          onKeyDown={onKey}
        >
          {options.map((o) => (
            <li key={o.choice} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={choice === o.choice}
                tabIndex={-1}
                className={styles.item}
                onClick={() => pick(o.choice)}
              >
                <span className={styles.check} aria-hidden="true">
                  {choice === o.choice ? <Icon name="check" size={16} stroke={2.4} /> : null}
                </span>
                {o.choice === "auto" ? (
                  <span className={styles.names}>
                    <span className={styles.native}>{t("language.auto")}</span>
                    <span className={styles.translated}>
                      {t("language.autoHint", { name: o.native })}
                    </span>
                  </span>
                ) : (
                  <span className={styles.names}>
                    <span className={styles.native} lang={LOCALE_INFO[o.locale].tag}>
                      {o.native}
                    </span>
                    {o.translated ? <span className={styles.translated}>{o.translated}</span> : null}
                  </span>
                )}
              </button>
              {o.choice === "auto" ? <hr className={styles.rule} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
