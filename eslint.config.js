import obsidian from "eslint-plugin-obsidianmd";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules/",
    "dist/",
    "**/*.js",
    "**/*.json",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        // Keep this consistent for TypeScript and Svelte files to avoid project reloads.
        extraFileExtensions: [".svelte"],
      },
    },
  },
  svelte.configs.recommended,
  ...obsidian.configs.recommended,
  {
    files: ["src/**/*.svelte", "src/**/*.svelte.ts"],
    extends: [svelte.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser },
      parser: svelteParser,
      parserOptions: {
        // parser for <script>
        parser: ts.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "svelte/no-at-html-tags": "off",
      "svelte/require-each-key": "off",
    },
  },
]);
