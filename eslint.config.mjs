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
    // Agent worktrees carry their own `.next/` and `node_modules/`, which the
    // root-level `.next/**` pattern does not reach. Without this, a bare
    // `npm run lint` walks them and reports tens of thousands of problems from
    // generated code — the gate still passes in CI (`.claude/` is gitignored),
    // so the only effect is that the gate becomes unrunnable locally.
    ".claude/**",
  ]),
]);

export default eslintConfig;
