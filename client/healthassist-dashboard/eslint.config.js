import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

// Export ESLint configuration
export default defineConfig([
  // Ignore files/folders globally
  globalIgnores(["dist"]),

  // Main config for JS and JSX files
  {
    files: ["**/*.{js,jsx}"], // Apply to all JS/JSX files

    // Extend recommended ESLint rules
    extends: [
      js.configs.recommended, // Base recommended JS rules
      reactHooks.configs["recommended-latest"], // Recommended React Hooks rules
      reactRefresh.configs.vite, // Recommended Vite + React refresh rules
    ],

    // Language options for parsing
    languageOptions: {
      ecmaVersion: 2020, // ECMAScript version for ESLint
      globals: globals.browser, // Provide browser globals (window, document, etc.)
      parserOptions: {
        ecmaVersion: "latest", // Latest ECMAScript syntax
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: "module", // Use ES modules
      },
    },

    // Custom rules
    rules: {
      // Disallow unused variables, but ignore vars starting with uppercase or _
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
]);
