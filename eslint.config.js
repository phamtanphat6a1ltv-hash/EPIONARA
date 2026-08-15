import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import securityPlugin from "eslint-plugin-security";
import globals from "globals";

export default [
  {
    ignores: ["dist/**/*", "node_modules/**/*", "tests/**/*"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "unused-imports": unusedImports,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],
      "no-undef": "error",
    },
  },
  {
    files: [
      "src/components/GlassCard.jsx",
      "src/components/nav/Nav.jsx",
      "src/components/auth/AuthModal.jsx",
      "src/pages/ChatbotPage.jsx",
      "src/pages/JournalPage.jsx",
      "src/pages/DashboardPage.jsx",
      "src/utils/db.js",
      "src/utils/geminiApi.js",
      "src/utils/secureStorage.js",
      "src/utils/performance.js",
    ],
    plugins: {
      security: securityPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      "security/detect-object-injection": "off",
      "react/prop-types": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "no-console": "off",
    },
  },
];
