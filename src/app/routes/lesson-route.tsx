import type { QueryClient } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  data,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { trackLessonsQuery } from "@/content/queries";
import { DEFAULT_LESSON_ID, findTrack, trackOfLesson } from "@/content/tracks";
import { isActive, resolveLesson } from "@/domain/lesson";
import { entryLesson } from "@/domain/progress";
import { BoardSignalsProvider } from "@/features/board/board-signals";
import { LessonPage } from "@/features/lesson/LessonPage";
import { LessonTabs } from "@/features/lesson/LessonTabs";
import { LessonStepper } from "@/features/navigation/LessonStepper";
import { TrackNav } from "@/features/navigation/TrackNav";
import { progress, useVariants } from "@/features/progress/progress-store";

// Loaders make sure a lesson's content is in the query cache before the page renders (no
// spinner, no waterfall); components then read it from the cache with useSuspenseQuery.

/** "/": back to the lesson you were on. */
export const homeLoader = () =>
  redirect(`/lessons/${progress.lastLesson.get() ?? DEFAULT_LESSON_ID}`);

/** "/tracks/:trackId": the first lesson of that theme that isn't working yet. */
export const trackLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const track = findTrack(params.trackId ?? "");
    if (!track || track.planned) throw data(`No theme called “${params.trackId}”`, { status: 404 });
    const lessons = await queryClient.query(trackLessonsQuery(track.id));
    const entry = entryLesson(lessons, progress.ticks.get());
    return redirect(`/lessons/${entry?.id ?? DEFAULT_LESSON_ID}`);
  };

/** "/lessons/:lessonId" */
export const lessonLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const lessonId = params.lessonId ?? "";
    const trackId = trackOfLesson(lessonId);
    if (!trackId) throw data(`No lesson called “${lessonId}”`, { status: 404 });
    const lessons = await queryClient.query(trackLessonsQuery(trackId));
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson || !isActive(lesson))
      throw data(`Lesson ${lessonId} is planned, not written yet`, { status: 404 });
    progress.lastLesson.set(lessonId);
    return { lessonId, trackId };
  };

/** The lesson of the current route, with its variant applied (URL first, then your last choice). */
export function useRouteLesson() {
  const { lessonId, trackId } =
    useLoaderData<Awaited<ReturnType<ReturnType<typeof lessonLoader>>>>();
  const { data: lessons } = useSuspenseQuery(trackLessonsQuery(trackId));
  const variants = useVariants();
  const [params, setParams] = useSearchParams();
  const base = lessons.find((l) => l.id === lessonId);
  if (!base || !isActive(base)) throw new Error(`Lesson ${lessonId} vanished from the cache`);
  const lesson = resolveLesson(base, params.get("variant") ?? variants[lessonId]);

  function chooseVariant(key: string) {
    progress.setVariant(lessonId, key);
    setParams(
      (p) => {
        p.set("variant", key);
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  return { lesson, lessons, trackId, chooseVariant };
}

export function LessonRoute() {
  const { lesson, lessons, trackId, chooseVariant } = useRouteLesson();
  return (
    <BoardSignalsProvider>
      <title>{`${lesson.id} · ${lesson.title} · ESP32-S3 Bench Guide`}</title>
      <TrackNav activeTrack={trackId} />
      <LessonStepper lessons={lessons} currentId={lesson.id} />
      <LessonTabs lesson={lesson} current="lab" />
      <LessonPage lesson={lesson} onVariant={chooseVariant} />
    </BoardSignalsProvider>
  );
}
