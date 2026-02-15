import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-undef": "off",
    },
  },
  {
    files: [
      "src/infrastructure/repositories/drizzle-snapshot-adapter.ts",
      "src/infrastructure/repositories/drizzle-repository-read-model-adapter.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression",
          message:
            "Use runtime validation helpers instead of `as` casts for persisted enum-like values.",
        },
      ],
    },
  },
  {
    files: [
      "src/application/**/*.ts",
      "src/domain/**/*.ts",
      "src/interface/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["**/infrastructure/**"],
        },
      ],
    },
  },
];
