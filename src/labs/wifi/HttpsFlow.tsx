import { SequenceDiagram } from "@/ui/sequence/SequenceDiagram";
import type { SeqFlows } from "@/ui/sequence/types";
import type { WidgetProps } from "@/widgets/types";
import { HTTPS_FLOWS, HTTPS_LEGEND, httpsLive } from "./https-flows";

/** Only the flows a panel asks for (`panel.flows`), in its order; all of them otherwise. */
function pickFlows(all: SeqFlows, keys: readonly string[] | undefined): SeqFlows {
  if (!keys?.length) return all;
  const picked = Object.fromEntries(keys.flatMap((k) => (all[k] ? [[k, all[k]] as const] : [])));
  return Object.keys(picked).length ? picked : all;
}

/** W3 "Follow one request, step by step": the weather fetch and the oracle call. */
export function HttpsFlow({ panel }: WidgetProps) {
  return (
    <SequenceDiagram
      flows={pickFlows(HTTPS_FLOWS, panel?.flows)}
      legend={HTTPS_LEGEND}
      frames
      waitLane={1}
      live={httpsLive}
    />
  );
}
