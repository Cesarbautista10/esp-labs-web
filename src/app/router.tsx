import { createHashRouter, data } from "react-router";
import { AppLayout } from "./AppLayout";
import { queryClient } from "./query-client";
import { RouteError } from "./RouteError";
import { homeLoader, LessonRoute, lessonLoader, trackLoader } from "./routes/lesson-route";

// A hash router: the guide is a static bundle that must work on any static host (any subfolder) and a
// claude.ai artifact, none of which can rewrite deep paths to index.html. URLs look like
// #/lessons/R3?variant=v2 and are shareable.
export const router = createHashRouter([
  {
    path: "/",
    Component: AppLayout,
    ErrorBoundary: RouteError,
    // First paint while the first lesson's content chunk loads (a few ms from cache).
    HydrateFallback: () => <p className="visually-hidden">Loading the bench guide…</p>,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { index: true, loader: homeLoader },
          { path: "lessons", loader: homeLoader },
          { path: "tracks/:trackId", loader: trackLoader(queryClient) },
          { path: "lessons/:lessonId", loader: lessonLoader(queryClient), Component: LessonRoute },
          {
            // Reading a lab's code: same loader, its own lazily loaded screen.
            path: "lessons/:lessonId/code",
            loader: lessonLoader(queryClient),
            lazy: async () => ({ Component: (await import("./routes/code-route")).Component }),
          },
          {
            path: "settings",
            lazy: async () => ({ Component: (await import("./routes/settings-route")).Component }),
          },
          {
            path: "log",
            lazy: async () => {
              const route = await import("./routes/log-route");
              return { loader: route.logLoader(queryClient), Component: route.Component };
            },
          },
          {
            path: "*",
            loader: () => {
              throw data("No such page", { status: 404 });
            },
            Component: () => null,
          },
        ],
      },
    ],
  },
]);
