import { defineConfig, devices } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Playwright — SEO regression suite (CLAUDE.md §8).
//
// Runs against the PRODUCTION server (`next start`), not the dev server: the
// SEO invariants (canonical, JSON-LD, metadata) must hold on the statically
// generated output that Vercel actually serves. A production build is required
// first: `npm run build` (CI builds with SITE_INDEXABLE=true so the suite can
// also assert that indexable pages carry no noindex).
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  testDir: './tests/seo',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    // Dedicated port: a dev server (or another worktree's `next start`) on
    // 3000 must never be reused — it would serve a stale build.
    baseURL: 'http://localhost:3100',
  },
  projects: [
    // SEO assertions are engine-agnostic (they inspect server-rendered HTML),
    // so a single Chromium project is enough.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
