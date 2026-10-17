import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// react-hooks `recommended` carries the React Compiler rules (purity, refs, set-state-in-effect,
// immutability...), so a component that would de-opt the compiler fails lint instead.
export default tseslint.config(
  { ignores: ["dist", "docs-llm", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.configs.recommended,
      ...pluginQuery.configs["flat/recommended"],
    ],
    languageOptions: { ecmaVersion: 2024, globals: globals.browser },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "error",
    },
  },
  {
    files: ["src/lib/logger.ts", "vite.config.ts", "eslint.config.ts"],
    rules: { "no-console": "off" },
  },
);
