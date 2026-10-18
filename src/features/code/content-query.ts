import { queryOptions } from "@tanstack/react-query";
import { createGlossary } from "@/domain/code/glossary";

// The phrasebook and the hand-written tours: one lazily loaded chunk, needed only to read code.
export const codeContentQuery = () =>
  queryOptions({
    queryKey: ["content", "code"] as const,
    queryFn: async () => {
      const [{ GLOSSARY, TOPIC_LABELS }, { TOURS }] = await Promise.all([
        import("@/content/code/glossary"),
        import("@/content/code/tours"),
      ]);
      return { glossary: createGlossary(GLOSSARY), topics: TOPIC_LABELS, tours: TOURS };
    },
    staleTime: "static",
    gcTime: Infinity,
  });
