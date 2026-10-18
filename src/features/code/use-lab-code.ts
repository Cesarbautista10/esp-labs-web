import { useSuspenseQuery } from "@tanstack/react-query";
import { createLogger } from "@/lib/logger";
import { codeContentQuery } from "./content-query";
import { buildLabCode, type LabCode } from "./lab-code";
import { firmwareEnvQuery } from "./queries";
import type { FirmwareEnvDoc } from "./schema";

const log = createLogger("code");
// Analysing a lab takes a few milliseconds; do it once per fetched document.
const cache = new WeakMap<FirmwareEnvDoc, LabCode>();

/** The lab's code, analysed and toured. Suspends while the code or the phrasebook loads. */
export function useLabCode(envName: string): LabCode {
  const { data: doc } = useSuspenseQuery(firmwareEnvQuery(envName));
  const { data: content } = useSuspenseQuery(codeContentQuery());
  let lab = cache.get(doc);
  if (!lab) {
    lab = buildLabCode(
      doc,
      content.glossary,
      content.tours.find((t) => t.env === envName),
    );
    cache.set(doc, lab);
    log.debug("lab analysed", { env: envName, files: lab.files.length });
    for (const p of lab.problems) log.warn("tour anchor problem", { env: envName, ...p });
  }
  return lab;
}
