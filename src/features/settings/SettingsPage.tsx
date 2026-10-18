import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { analyze } from "@/domain/code/analyze";
import { codeProgress, useAllProgress, useMetWords } from "@/features/code/code-progress";
import { CodeView } from "@/features/code/CodeView";
import { codeContentQuery } from "@/features/code/content-query";
import type { CodeFile } from "@/features/code/lab-code";
import { ThemeSwitch } from "@/features/theme/ThemeSwitch";
import { createLogger } from "@/lib/logger";
import { MOTION_CHOICES, motionStore, useMotionChoice } from "@/lib/motion";
import { ChoiceGroup } from "@/ui/ChoiceGroup";
import { Switch } from "@/ui/Switch";
import { LEVEL_INFO, LEVELS, type Settings, VIEW_INFO, VIEWS } from "./settings";
import { settingsStore, useSettings } from "./settings-store";
import styles from "./SettingsPage.module.css";

const log = createLogger("settings");

// A tiny program to preview the code settings on: the shape every lab starts from.
const SAMPLE = `// Blink: the hello world of boards.
#include <Arduino.h>

constexpr uint8_t kLed = 4;  // the LED's pin

void setup() {
  pinMode(kLed, OUTPUT);  // this pin drives
}

void loop() {
  digitalWrite(kLed, HIGH);  // on
  delay(500);
  digitalWrite(kLed, LOW);   // off
  delay(500);
}
`;
const sampleAnalysis = analyze(SAMPLE);
const SAMPLE_FILE: CodeFile = {
  path: "sample/blink.cpp",
  name: "blink.cpp",
  role: "lab",
  group: "sample",
  analysis: sampleAnalysis,
  stops: [],
  codeLineCount: 9,
};

const HINTS: { key: Settings["hints"]; label: string }[] = [
  { key: "pop", label: "Introduce each new word" },
  { key: "underline", label: "Underline only" },
  { key: "off", label: "Off" },
];
const SIZES: { key: Settings["codeSize"]; label: string }[] = [
  { key: "s", label: "Small" },
  { key: "m", label: "Medium" },
  { key: "l", label: "Large" },
];
const PACES: { key: Settings["pace"]; label: string }[] = [
  { key: "slow", label: "Slow" },
  { key: "normal", label: "Normal" },
  { key: "fast", label: "Fast" },
];
const MOTION_LABEL = { system: "Follow my device", calm: "Calm" } as const;

/** Everything you can tune, grouped by what it changes, with a live preview of the code view. */
export function SettingsPage() {
  const settings = useSettings();
  const motion = useMotionChoice();
  const { data: content } = useSuspenseQuery(codeContentQuery());
  const met = useMetWords();
  const progress = useAllProgress();
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      settingsStore.change(key, value);
  const [preview, setPreview] = useState<number | null>(null);
  const metCount = Object.keys(met).length;
  const labsRead = Object.values(progress).filter((p) => p.stops.length > 0).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Settings</p>
        <h2 className={styles.title}>Make the guide yours</h2>
        <p className={styles.lead}>Saved in this browser only. Every change applies at once.</p>
      </header>

      <section className={styles.section} aria-labelledby="set-level">
        <h3 id="set-level" className={styles.h}>
          How deep to go
        </h3>
        <div className={styles.levels} role="radiogroup" aria-labelledby="set-level">
          {LEVELS.map((level, i) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={settings.level === level}
              className={styles.level}
              onClick={() => set("level")(level)}
            >
              <span className={styles.steps} aria-hidden="true">
                {LEVELS.map((l, k) => (
                  <span key={l} data-on={k <= i || undefined} />
                ))}
              </span>
              <span className={styles.levelName}>{LEVEL_INFO[level].label}</span>
              <span className={styles.levelBlurb}>{LEVEL_INFO[level].blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="set-view">
        <h3 id="set-view" className={styles.h}>
          How the code reader looks
        </h3>
        <div className={styles.views} role="radiogroup" aria-labelledby="set-view">
          {VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              role="radio"
              aria-checked={settings.view === view}
              className={styles.level}
              onClick={() => set("view")(view)}
            >
              <span className={styles.sketch} data-view={view} aria-hidden="true">
                <span className={styles.sketchBar} />
                <span className={styles.sketchCode} />
                <span className={styles.sketchSide} />
                <span className={styles.sketchFoot} />
              </span>
              <span className={styles.levelName}>{VIEW_INFO[view].label}</span>
              <span className={styles.levelBlurb}>{VIEW_INFO[view].blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        <div className={styles.stack}>
          <section className={styles.section} aria-labelledby="set-learn">
            <h3 id="set-learn" className={styles.h}>
              Learning
            </h3>
            <Switch
              label="Guess first"
              hint="Each tour stop asks what you think the code does before it tells you. Guessing makes it stick."
              checked={settings.guessFirst}
              onChange={set("guessFirst")}
            />
            <div className={styles.field}>
              <span className={styles.fieldLabel} id="hints-label">
                C++ hints
              </span>
              <span className={styles.fieldHint}>
                New words get a small card the first time you meet them; known words stay
                underlined.
              </span>
              <ChoiceGroup
                label="C++ hints"
                value={settings.hints}
                onChange={set("hints")}
                choices={HINTS}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Line by line pace</span>
              <span className={styles.fieldHint}>How long “Play” stays on each line.</span>
              <ChoiceGroup
                label="Line by line pace"
                value={settings.pace}
                onChange={set("pace")}
                choices={PACES}
              />
            </div>
          </section>

          <section className={styles.section} aria-labelledby="set-code">
            <h3 id="set-code" className={styles.h}>
              Code display
            </h3>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Text size</span>
              <ChoiceGroup
                label="Code text size"
                value={settings.codeSize}
                onChange={set("codeSize")}
                choices={SIZES}
              />
            </div>
            <Switch
              label="Line numbers"
              checked={settings.lineNumbers}
              onChange={set("lineNumbers")}
            />
            <Switch
              label="Wrap long lines"
              hint="Handy on a phone: no sideways scrolling."
              checked={settings.wrap}
              onChange={set("wrap")}
            />
            <Switch
              label="Soften comments"
              hint="Fades the programmer's notes so the code itself stands out."
              checked={settings.comments === "dim"}
              onChange={(on) => set("comments")(on ? "dim" : "show")}
            />
            <Switch
              label="Fold long data"
              hint="Long tables and built-in web pages fold into one line until you open them."
              checked={settings.fold}
              onChange={set("fold")}
            />
          </section>

          <section className={styles.section} aria-labelledby="set-look">
            <h3 id="set-look" className={styles.h}>
              Look and motion
            </h3>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Colour theme</span>
              <ThemeSwitch />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Motion</span>
              <span className={styles.fieldHint}>
                Calm turns sliding and pulsing down everywhere, simulators included.
              </span>
              <ChoiceGroup
                label="Motion"
                value={motion}
                onChange={(m) => motionStore.set(m)}
                choices={MOTION_CHOICES.map((m) => ({ key: m, label: MOTION_LABEL[m] }))}
              />
            </div>
          </section>
        </div>

        <aside className={styles.preview} aria-label="Preview">
          <p className={styles.previewLabel}>Preview</p>
          <div className={styles.previewCode}>
            <CodeView
              file={SAMPLE_FILE}
              glossary={content.glossary}
              settings={settings}
              selected={preview}
              onLine={setPreview}
              onTerm={(_, line) => setPreview(line)}
              label="Preview of the code view"
            />
          </div>
        </aside>
      </div>

      <section className={styles.section} aria-labelledby="set-progress">
        <h3 id="set-progress" className={styles.h}>
          Your progress
        </h3>
        <p className={styles.stats}>
          <span>
            <b>{metCount}</b> of {content.glossary.entries.length} C++ words met
          </span>
          <span>
            <b>{labsRead}</b> {labsRead === 1 ? "lab" : "labs"} with code read
          </span>
        </p>
        <div className={styles.resets}>
          <ConfirmButton label="Forget code I read" onConfirm={() => codeProgress.resetReading()} />
          <ConfirmButton label="Forget words I met" onConfirm={() => codeProgress.resetWords()} />
          <ConfirmButton
            label="Reset these settings"
            onConfirm={() => {
              settingsStore.reset();
              motionStore.set("system");
              log.info("all settings reset");
            }}
          />
        </div>
      </section>
    </div>
  );
}

/** A destructive action that asks once more before it runs. */
function ConfirmButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  return asking ? (
    <span className={styles.confirm} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.danger}
        onClick={() => {
          onConfirm();
          setAsking(false);
        }}
      >
        Yes, {label.toLowerCase()}
      </button>
      <button type="button" className={styles.cancel} onClick={() => setAsking(false)}>
        Keep it
      </button>
    </span>
  ) : (
    <button type="button" className={styles.cancel} onClick={() => setAsking(true)}>
      {label}
    </button>
  );
}
