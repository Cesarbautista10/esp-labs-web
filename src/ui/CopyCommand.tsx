import { useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import styles from "./CopyCommand.module.css";

const LABEL = { idle: "Copy", copied: "Copied", selected: "Selected" } as const;

/** A shell command with a copy button. Falls back to selecting the text. */
export function CopyCommand({ command, compact = false }: { command: string; compact?: boolean }) {
  const [state, setState] = useState<keyof typeof LABEL>("idle");
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    const result = await copyText(command, codeRef.current);
    setState(result);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1400);
  }

  return (
    <div className={`${styles.cmd} ${compact ? styles.compact : ""}`}>
      <code ref={codeRef}>{command}</code>
      <button type="button" onClick={copy} aria-label={`Copy command: ${command}`}>
        <span aria-live="polite">{LABEL[state]}</span>
      </button>
    </div>
  );
}
