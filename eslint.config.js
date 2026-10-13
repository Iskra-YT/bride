import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: ["dist/**", "**/dist/**"],
    },

    {
        files: ["**/*.{js,mjs,cjs}"],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },

    js.configs.recommended,
]);
