import js from "@eslint/js";
import obsidian from "eslint-plugin-obsidianmd";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";

const config = defineConfig([
  js.configs.recommended,
  ts.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  ...obsidian.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser },
      parser: ts.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
  },
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
  globalIgnores([
    "dist/",
    "**/*.js",
    "**/*.json",
  ]),
]);

export default config;
