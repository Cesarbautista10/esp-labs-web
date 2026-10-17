import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// React Compiler memoizes components and hooks at build time, so the code stays free of
// hand-written useMemo/useCallback. `base: "./"` keeps every asset URL relative: the build
// works from any static host, in any subfolder, or a claude.ai artifact, with no rewrite rules.
export default defineConfig({
  base: "./",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    target: "es2023",
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: lesson code changes far more often than React does.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "router", test: /node_modules[\\/]react-router[\\/]/ },
            { name: "query", test: /node_modules[\\/]@tanstack[\\/]/ },
          ],
        },
      },
    },
  },
  server: { port: 5180 },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
