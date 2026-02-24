import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:prettier/recommended"),
  {
    rules: {
      // TypeScript strict 규칙
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // React 규칙
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "error",

      // Import 정렬
      "sort-imports": [
        "warn",
        {
          ignoreCase: true,
          ignoreMemberSort: true,
          ignoreDeclarationSort: true,
        },
      ],

      // 변수 관련
      "no-unused-vars": "off", // TypeScript 규칙이 대체
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],

      // 일반 규칙
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
