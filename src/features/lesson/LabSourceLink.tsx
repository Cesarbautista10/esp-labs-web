import { env } from "@/config/env";
import { labSourceUrl } from "@/domain/lab-source";
import { Icon } from "@/ui/Icon";
import styles from "./LabSourceLink.module.css";

/** "Code on GitHub": the lab's folder in the esp-labs repo. Nothing for a lesson that has no lab. */
export function LabSourceLink({ cmd, className }: { cmd: string; className?: string }) {
  const href = labSourceUrl(env.labsSourceUrl, cmd);
  if (!href) return null;
  return (
    <a className={className ? `${styles.link} ${className}` : styles.link} href={href} target="_blank" rel="noreferrer noopener">
      <Icon name="branch" size={16} />
      Code on GitHub
      <span aria-hidden="true">↗</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
