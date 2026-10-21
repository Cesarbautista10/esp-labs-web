import type { QueryClient } from "@tanstack/react-query";
import { trackLessonsQuery } from "@/content/queries";
import { TRACKS } from "@/content/tracks";
import { LabsHome } from "@/features/home/LabsHome";

// "/" and "/lessons": the labs map. Every theme's content chunk is small, so the loader brings
// them all in before the page shows (no row fills in late).
export const homeLoader = (queryClient: QueryClient) => async () => {
  await Promise.all(
    TRACKS.filter((t) => !t.planned).map((t) => queryClient.query(trackLessonsQuery(t.id))),
  );
  return null;
};

export function HomeRoute() {
  return (
    <>
      <title>Labs · ESP32-S3 Bench Guide</title>
      <LabsHome />
    </>
  );
}
