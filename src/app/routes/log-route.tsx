import type { QueryClient } from "@tanstack/react-query";
import { benchLogQuery, benchStatusQuery } from "@/features/bench/queries";
import { LogPage } from "@/features/bench/LogPage";

// Lazy route module: the log page's code loads only when you open it.

export const logLoader = (queryClient: QueryClient) => async () => {
  await Promise.all([queryClient.query(benchLogQuery()), queryClient.query(benchStatusQuery())]);
  return null;
};

export function Component() {
  return (
    <>
      <title>Bench log · ESP32-S3 Bench Guide</title>
      <LogPage />
    </>
  );
}
