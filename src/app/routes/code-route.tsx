import { Suspense } from "react";
import { findTrack } from "@/content/tracks";
import { CodeReader, ReaderSkeleton } from "@/features/code/reader/CodeReader";
import { envOfCommand } from "@/features/code/queries";
import { useLabCode } from "@/features/code/use-lab-code";
import { LabSourceLink } from "@/features/lesson/LabSourceLink";
import { LessonTabs } from "@/features/lesson/LessonTabs";
import { VariantSwitch } from "@/features/lesson/VariantSwitch";
import { LessonStepper } from "@/features/navigation/LessonStepper";
import { TrackNav } from "@/features/navigation/TrackNav";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import styles from "./code-route.module.css";
import { useRouteLesson } from "./lesson-route";

// "/lessons/:lessonId/code": the code that runs on the board in this lesson, read with a guide.
// Lazy route module: the reader, the phrasebook and the C++ analyser load only when you come here.

function LabReader({ env, lessonHref }: { env: string; lessonHref: string }) {
  return <CodeReader lab={useLabCode(env)} lessonHref={lessonHref} />;
}

export function Component() {
  const { lesson, lessons, trackId, chooseVariant } = useRouteLesson();
  const env = envOfCommand(lesson.cmd);
  const lessonHref = `/lessons/${lesson.id}${lesson.variantKey ? `?variant=${encodeURIComponent(lesson.variantKey)}` : ""}`;
  return (
    <>
      <title>{`${lesson.id} code · ${lesson.title} · ESP32-S3 Bench Guide`}</title>
      {/* The same way around the labs as on the lab page, but every pad opens that lab's code. */}
      <TrackNav activeTrack={trackId} view="code" />
      <LessonStepper
        lessons={lessons}
        currentId={lesson.id}
        color={findTrack(trackId)?.color ?? "--copper"}
        view="code"
      />
      <div className={styles.bar}>
        <p className={styles.heading}>
          <span className={styles.id}>{lesson.id}</span> {lesson.heading}
        </p>
        <div className={styles.actions}>
          {lesson.variants ? (
            <VariantSwitch
              variants={lesson.variants}
              current={lesson.variantKey}
              onChange={chooseVariant}
            />
          ) : null}
          <LabSourceLink cmd={lesson.cmd} />
        </div>
      </div>
      <LessonTabs lesson={lesson} current="code" hideOnScroll />
      {env ? (
        <ErrorBoundary name={`code ${env}`} resetKey={env}>
          <Suspense fallback={<ReaderSkeleton />}>
            <LabReader key={env} env={env} lessonHref={lessonHref} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <p className={styles.none}>
          This lesson sets up your tools: there is no program for the board yet. The first code to
          read is in lesson 01.
        </p>
      )}
    </>
  );
}
