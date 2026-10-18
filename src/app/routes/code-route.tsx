import { Suspense } from "react";
import { CodeReader, ReaderSkeleton } from "@/features/code/reader/CodeReader";
import { envOfCommand } from "@/features/code/queries";
import { useLabCode } from "@/features/code/use-lab-code";
import { LessonTabs } from "@/features/lesson/LessonTabs";
import { VariantSwitch } from "@/features/lesson/VariantSwitch";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import styles from "./code-route.module.css";
import { useRouteLesson } from "./lesson-route";

// "/lessons/:lessonId/code": the code that runs on the board in this lesson, read with a guide.
// Lazy route module: the reader, the phrasebook and the C++ analyser load only when you come here.

function LabReader({ env, lessonHref }: { env: string; lessonHref: string }) {
  return <CodeReader lab={useLabCode(env)} lessonHref={lessonHref} />;
}

export function Component() {
  const { lesson, chooseVariant } = useRouteLesson();
  const env = envOfCommand(lesson.cmd);
  const lessonHref = `/lessons/${lesson.id}${lesson.variantKey ? `?variant=${encodeURIComponent(lesson.variantKey)}` : ""}`;
  return (
    <>
      <title>{`${lesson.id} code · ${lesson.title} · ESP32-S3 Bench Guide`}</title>
      <div className={styles.bar}>
        <p className={styles.heading}>
          <span className={styles.id}>{lesson.id}</span> {lesson.heading}
        </p>
        {lesson.variants ? (
          <VariantSwitch
            variants={lesson.variants}
            current={lesson.variantKey}
            onChange={chooseVariant}
          />
        ) : null}
      </div>
      <LessonTabs lesson={lesson} current="code" />
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
