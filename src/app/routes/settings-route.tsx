import { Suspense } from "react";
import { SettingsPage } from "@/features/settings/SettingsPage";

// Lazy route module: the settings page and its live code preview load only when opened.
export function Component() {
  return (
    <>
      <title>Settings · ESP32-S3 Bench Guide</title>
      <Suspense fallback={<p>Loading settings…</p>}>
        <SettingsPage />
      </Suspense>
    </>
  );
}
