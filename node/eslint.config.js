// eslint.config.js
import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import pluginPrettier from "eslint-plugin-prettier";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginTs from "@typescript-eslint/eslint-plugin";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass in ESLint’s own recommended config
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
});
export default [
  {
    ignores: [
      "**", // ignore everything
      "!src/**", // except files under src/
      "src/osparc-api-ts-client/**", // ignore osparc-api-ts-client
    ],
  },
  {
    plugins: {
      prettier: pluginPrettier,
      import: pluginImport,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "@typescript-eslint": pluginTs,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.resolve(__dirname, "./tsconfig.app.json"),
        tsconfigRootDir: __dirname,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:react/jsx-runtime",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "prettier",
  ),

  // 2) Your custom overrides for JS/TS files
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    settings: {
      react: {
        version: "detect",
        runtime: "automatic",
      },
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },

    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "prettier/prettier": ["error"],
      "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
      "no-underscore-dangle": "off",
      "react/require-default-props": "off",
      "react/function-component-definition": "off",
      "import/prefer-default-export": "off",
      "react/jsx-no-useless-fragment": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/lines-between-class-members": "off",
      "max-classes-per-file": ["warn", 2],
      "prefer-regex-literals": "off",
      "no-control-regex": "off",
      "no-console": "off",
      "no-await-in-loop": "off",
      "react/jsx-props-no-spreading": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
