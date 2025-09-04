// eslint.config.js
import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import pluginPrettier from "eslint-plugin-prettier";

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
      // react:        pluginReact,
      // "react-hooks": pluginReactHooks,
      // import:       pluginImport,
      // "@typescript-eslint": pluginTsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.resolve(__dirname, "./tsconfig.json"),
        tsconfigRootDir: __dirname,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "prettier",
  ),

  // 2) Your custom overrides for JS/TS files
  {
    files: ["*.js", "*.jsx", "*.ts", "*.tsx"],
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },

    rules: {
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
    },
  },
];
