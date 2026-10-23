# SEO Técnico — seotecnico.dev.br

[![CI](https://github.com/Alf4kill/seotecnico.dev.br/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Alf4kill/seotecnico.dev.br/actions/workflows/ci.yml)

A live, public **technical SEO laboratory**: Portuguese-first content and free
web tools focused on technical SEO for developers who build modern websites,
with Next.js as the reference implementation. The site itself is
the experiment — every technique documented here is implemented on this very
domain and measured with real Google Search Console and CrUX data.

Built and maintained by Nalpi — technical SEO engineer.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- MDX content in `/content` (no CMS)
- Hosted on Vercel

## Development

Node version is pinned in [`.nvmrc`](./.nvmrc) — `nvm use` picks it up, and CI
reads the same file.

```bash
npm install
npm run dev     # local dev server
npm run build   # production build (all routes SSG)
npm run lint    # eslint
```

Copy `.env.example` to `.env.local` for local configuration. The site defaults
to `noindex` unless `SITE_INDEXABLE=true` is set (production fail-safe).

## Testing

Four gates guard `main`, and every one of them runs locally.

```bash
npm test        # vitest — unit tests for /lib and the API routes, component tests for the tools
npm run lint    # eslint
npx tsc --noEmit
```

The SEO regression suite and the performance budgets both audit the **built**
site, so they need a production build first — and that build needs two
environment variables set explicitly:

```bash
NEXT_PUBLIC_DOMAIN=https://seotecnico.dev.br SITE_INDEXABLE=true npm run build
NEXT_PUBLIC_DOMAIN=https://seotecnico.dev.br SITE_INDEXABLE=true npm run test:seo
npm run lhci
```

Both variables are needed on **both** commands — the build bakes them into the
HTML, and the suite reads them again to know what to assert. Getting this wrong
does not fail loudly:

- **`NEXT_PUBLIC_DOMAIN`** — a local `.env.local` typically points it at
  `http://localhost:3000`, which Next bakes into every canonical and OG URL at
  build time. Playwright does not read `.env.local`, so the suite falls back to
  the production domain and every canonical assertion fails on a mismatch that
  exists only in the local build.
- **`SITE_INDEXABLE`** — without it the build emits `noindex` everywhere (the
  fail-safe above). Missing it at build time fails the suite; missing it at
  *test* time is worse — the noindex assertion and the robots.txt crawler-policy
  test skip themselves, and the run goes green having checked less than it
  looks.

The suite runs against `next start` on port 3100 and Lighthouse on 3200, both
deliberately off 3000 so a dev server is never audited by mistake.

What the SEO suite asserts, per route enumerated from `app/sitemap.ts`: exactly
one `<h1>`, title and description within length limits, a self-referencing
canonical, JSON-LD that parses with the expected `@type` set, and reciprocal
hreflang pairs. New articles are covered the moment their MDX file lands.

### Quality: what each layer covers

| Tool | Command | Covers |
|------|---------|--------|
| Vitest | `npm test` | Pure logic in `/lib` and the API routes (coverage floor in `vitest.config.ts`) |
| Vitest + React Testing Library | `npm test` | The three tool UIs: queried by role and label, driven with `user-event`, APIs mocked |
| Playwright | `npm run test:seo` | SEO invariants per route, theme and contrast by colour role, analytics events, search |
| axe-core + Playwright | `npm run test:a11y` | WCAG 2.0/2.1 A and AA on every route, both themes, tools after producing a result |
| Lighthouse CI | `npm run lhci` | Performance budgets on pull requests (`lighthouserc.js`) |

`test:a11y` is a subset of `test:seo` (same build, same env variables) and runs
with it in CI. **No axe rule is disabled, but `color-contrast` is a warning,
not a failure**: this site has its own visual identity, so a colour change is a
design decision taken after seeing the finding, not one the CI imposes. The
findings are grouped by colour pair in `test-results/a11y-report.md`, in the
CI job summary and as `::warning::` annotations on the pull request. Contrast
by colour role stays a blocking gate in `tests/seo/contrast.spec.ts`. Every
other axe rule fails the build. Results: [`docs/a11y-test-report.md`](./docs/a11y-test-report.md).

## Licensing

- **Code** — [MIT](./LICENSE). Learn from it, reuse it, adapt it.
- **Content** — articles and guides in [`/content`](./content), images, and
  original data visualizations are **all rights reserved**
  ([details](./content/LICENSE.md)). Short quotes with attribution and a link
  to the original are welcome; republishing is not.

## Project reference

See [CLAUDE.md](./CLAUDE.md) for the full project spec: objectives, site
architecture, SEO requirements, measurement plan, and roadmap.
