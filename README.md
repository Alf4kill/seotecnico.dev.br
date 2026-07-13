# SEO Técnico — seotecnico.dev.br

A live, public **technical SEO laboratory**: Portuguese-first content and free
web tools focused on technical SEO for Next.js developers. The site itself is
the experiment — every technique documented here is implemented on this very
domain and measured with real Google Search Console and CrUX data.

Built and maintained by Nalpi — technical SEO engineer.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- MDX content in `/content` (no CMS)
- Hosted on Vercel

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # production build (all routes SSG)
npm run lint    # eslint
```

Copy `.env.example` to `.env.local` for local configuration. The site defaults
to `noindex` unless `SITE_INDEXABLE=true` is set (production fail-safe).

## Licensing

- **Code** — [MIT](./LICENSE). Learn from it, reuse it, adapt it.
- **Content** — articles and guides in [`/content`](./content), images, and
  original data visualizations are **all rights reserved**
  ([details](./content/LICENSE.md)). Short quotes with attribution and a link
  to the original are welcome; republishing is not.

## Project reference

See [CLAUDE.md](./CLAUDE.md) for the full project spec: objectives, site
architecture, SEO requirements, measurement plan, and roadmap.
