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
    // Generated code (Prisma client + WASM compiler artifacts). Lint findings
    // here are upstream config/tooling problems, not code-quality issues. The
    // 2026-04-26 /gstack-health audit found ~482 of 590 lint errors lived
    // here; ignoring drops the lint score from 0/10 to a meaningful number.
    "generated/**",
    // GSD vendor hooks (`.claude/hooks/*.js`) are Node CommonJS scripts and
    // legitimately use `require()`. They are managed by gsd, not Korvo code,
    // so lint findings here are out of scope for the project's quality bar.
    ".claude/**",
    // GSD vendor CLI (`.github/get-shit-done/bin/lib/*.cjs`). Same story:
    // CommonJS by design, vendor-managed, not part of Korvo's quality bar.
    ".github/**",
  ]),
]);

export default eslintConfig;
