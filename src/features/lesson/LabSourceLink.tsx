import { env } from "@/config/env";
import { labDirOfCommand, labSourceUrl } from "@/domain/lab-source";
import { GithubMark } from "@/ui/GithubMark";
import { Icon } from "@/ui/Icon";
import styles from "./LabSourceLink.module.css";

/**
 * The lab's folder in the esp-labs repo, as a card: the GitHub mark on a board-green tile (like the
 * app's logo), what it opens, and the folder it lands in. Nothing for a lesson that has no lab.
 */
export function LabSourceLink({ cmd, className }: { cmd: string; className?: string }) {
  const href = labSourceUrl(env.labsSourceUrl, cmd);
  const dir = labDirOfCommand(cmd);
  if (!href || !dir) return null;
  return (
    <a
      className={className ? `${styles.card} ${className}` : styles.card}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
    >
      <span className={styles.mark}>
        <GithubMark size={22} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>Open this lab's code on GitHub</span>
        <span className={styles.path}>esp-labs / labs / {dir}</span>
      </span>
      <span className={styles.go}>
        <Icon name="arrow" size={16} />
      </span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
