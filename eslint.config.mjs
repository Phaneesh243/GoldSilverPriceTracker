import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "stitch_goldsilverprices_finance_platform_design/**",
    "certificates/**",
  ]),
  {
    rules: {
      // Existing client components synchronise external storage and URL state in effects.
      // Keep the remaining correctness and accessibility rules enabled while this legacy UI is migrated.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
