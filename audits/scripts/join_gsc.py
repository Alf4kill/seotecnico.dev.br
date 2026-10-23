"""Join a crawl with Search Console's Performance → Pages export.

Answers the crawl audit's Search Console questions (docs/crawl-audit-2026-10.md
§7): which pages earn impressions, which linked pages earn none (and whether
they are simply too new), and whether Google shows any URL the crawl did not
find. The GSC export is a manual UI download: there is no personal GSC API for
this project, and the work-account credentials must never be used here.

    audits/.venv/Scripts/python -I audits/scripts/join_gsc.py \
        --crawl audits/crawl-2026-10-23 --gsc-end 2026-10-21

Expects <crawl>/advertools/pages.csv (from crawl_audit.py) and
<crawl>/gsc/Páginas.csv. Writes <crawl>/gsc-join.csv (gitignored) and
<crawl>/summary-gsc.json (versioned).
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

import pandas as pd

CONTENT = Path('content')


def published_dates() -> dict[str, str]:
    """datePublished per site path, read from the MDX frontmatter."""
    routes = {
        'blog': '/blog/{slug}',
        'en/blog': '/en/blog/{slug}',
        'guia': '/guia/{slug}',
        'en/guide': '/en/guide/{slug}',
        'en/case-studies': '/en/case-studies/{slug}',
    }
    dates = {}
    for folder, pattern in routes.items():
        for mdx in (CONTENT / folder).glob('*.mdx'):
            head = mdx.read_text(encoding='utf-8').split('---')[1]
            # Frontmatter values come with double quotes, single quotes or none.
            slug = re.search(r'''^slug:\s*["']?([^"'\n]+)''', head, re.M)
            published = re.search(r'''^datePublished:\s*["']?([^"'\n]+)''', head, re.M)
            if slug and published:
                dates[pattern.format(slug=slug.group(1))] = published.group(1)
    return dates


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--crawl', required=True)
    parser.add_argument('--gsc-end', required=True, help='last day in the GSC export (Gráfico.csv)')
    args = parser.parse_args()

    crawl = Path(args.crawl)
    pages = pd.read_csv(crawl / 'advertools' / 'pages.csv')
    gsc = pd.read_csv(crawl / 'gsc' / 'Páginas.csv')
    gsc.columns = ['url', 'clicks', 'impressions', 'ctr', 'position']
    gsc['path'] = gsc['url'].map(lambda u: urlsplit(u).path or '/')

    joined = pages.merge(gsc[['path', 'clicks', 'impressions', 'position']], on='path', how='outer', indicator=True)
    joined['impressions'] = joined['impressions'].fillna(0).astype(int)
    joined['clicks'] = joined['clicks'].fillna(0).astype(int)
    dates = published_dates()
    end = date.fromisoformat(args.gsc_end)
    joined['published'] = joined['path'].map(dates)
    joined['days_exposed'] = joined['published'].map(
        lambda d: (end - date.fromisoformat(d)).days + 1 if isinstance(d, str) else None
    )
    joined.drop(columns='_merge').sort_values('impressions', ascending=False).to_csv(crawl / 'gsc-join.csv', index=False)

    crawled = joined[joined['_merge'] != 'right_only']
    no_impressions = crawled[crawled['impressions'] == 0]
    summary = {
        'gsc_window': f'last 3 months to {args.gsc_end}, Web search',
        'crawled_pages': int(len(crawled)),
        'pages_with_impressions': int((crawled['impressions'] > 0).sum()),
        'gsc_urls_not_in_crawl': sorted(joined.loc[joined['_merge'] == 'right_only', 'path']),
        'indexed_or_shown_without_internal_links': int(((crawled['impressions'] > 0) & (crawled['inlinks'] == 0)).sum()),
        'linked_without_impressions': int(len(no_impressions)),
        'linked_without_impressions_by_days_exposed': {
            'no_date (static page)': sorted(no_impressions.loc[no_impressions['days_exposed'].isna(), 'path']),
            '<=7 days': sorted(no_impressions.loc[no_impressions['days_exposed'] <= 7, 'path']),
            '8-30 days': sorted(no_impressions.loc[no_impressions['days_exposed'].between(8, 30), 'path']),
            '>30 days': sorted(no_impressions.loc[no_impressions['days_exposed'] > 30, 'path']),
        },
        'impressions_by_depth': {
            str(int(k)): {'pages': int(len(g)), 'with_impressions': int((g['impressions'] > 0).sum()), 'impressions': int(g['impressions'].sum())}
            for k, g in crawled.groupby('depth')
        },
        'total_clicks': int(crawled['clicks'].sum()),
        'total_impressions': int(crawled['impressions'].sum()),
    }
    (crawl / 'summary-gsc.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
