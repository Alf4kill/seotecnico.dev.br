"""Crawl audit of seotecnico.dev.br with advertools (Scrapy underneath).

Covers what the free Screaming Frog licence locks: custom extraction, a
configurable user agent and crawl delay, and a link graph that can be joined
with the sitemap and Search Console exports in pandas.

Run against the local production build (see docs/crawl-audit-2026-10.md):

    audits/.venv/Scripts/python audits/scripts/crawl_audit.py \
        --base http://localhost:3000 --out audits/crawl-2026-10-23

Writes, in --out:
    advertools/crawl.jsonl   raw crawl (gitignored)
    advertools/*.csv         per-check tables (gitignored)
    summary.json             aggregated counts (versioned)

Never seed /llms.txt: it links the llms trap of the crawler experiment
(docs/detection-experiment.md §4). The spider starts at the home page and only
follows <a href>, so the trap is unreachable from here.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import deque
from pathlib import Path
from urllib.parse import urldefrag, urlsplit

import advertools as adv
import pandas as pd

USER_AGENT = 'seotecnico-audit/1.0 (+https://seotecnico.dev.br/sobre)'

# advertools stores multi-valued fields joined by this separator.
SEP = '@@'

# Extra fields the default extraction does not cover.
XPATH = {
    'meta_robots': '//meta[@name="robots"]/@content',
    'hreflang_lang': '//link[@rel="alternate"][@hreflang]/@hreflang',
    'hreflang_href': '//link[@rel="alternate"][@hreflang]/@href',
    'html_lang': '/html/@lang',
}
# advertools reads attributes case-sensitively through lxml's HTML parser, which
# lowercases them, so Next's `hrefLang` is matched by `@hreflang` above.


def split(value) -> list[str]:
    if not isinstance(value, str) or value == '':
        return []
    return value.split(SEP)


def path_of(url: str, host: str) -> str | None:
    """Internal path without fragment, or None for another host."""
    url = urldefrag(url)[0]
    parts = urlsplit(url)
    if parts.netloc and parts.netloc != host:
        return None
    path = parts.path or '/'
    return path + (f'?{parts.query}' if parts.query else '')


def crawl(base: str, out: Path, delay: float) -> pd.DataFrame:
    raw = out / 'crawl.jsonl'
    if raw.exists():
        raw.unlink()  # advertools appends; a rerun must not mix two crawls
    # advertools shells out to the `scrapy` executable of this interpreter.
    os.environ['PATH'] = str(Path(sys.executable).parent) + os.pathsep + os.environ['PATH']
    adv.crawl(
        f'{base}/',
        str(raw),
        follow_links=True,
        allowed_domains=[urlsplit(base).hostname],
        xpath_selectors=XPATH,
        custom_settings={
            'USER_AGENT': USER_AGENT,
            'ROBOTSTXT_OBEY': True,
            'DOWNLOAD_DELAY': delay,
            'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
            'LOG_FILE': str(out / 'scrapy.log'),
            # Keep 3xx/4xx/5xx rows: they are findings, not noise.
            'HTTPERROR_ALLOW_ALL': True,
        },
    )
    return pd.read_json(raw, lines=True)


def link_graph(df: pd.DataFrame, host: str) -> pd.DataFrame:
    rows = []
    for _, page in df.iterrows():
        source = path_of(page['url'], host)
        for href, text, nofollow in zip(
            split(page.get('links_url')),
            split(page.get('links_text')),
            split(page.get('links_nofollow')),
        ):
            target = path_of(href, host)
            rows.append({
                'source': source,
                'href': href,
                'target': target,
                'internal': target is not None,
                'text': text.strip(),
                'nofollow': nofollow == 'True',
            })
    return pd.DataFrame(rows)


def depths(edges: pd.DataFrame) -> dict[str, int]:
    internal = edges[edges['internal']]
    adjacency = internal.groupby('source')['target'].apply(set).to_dict()
    depth = {'/': 0}
    queue = deque(['/'])
    while queue:
        current = queue.popleft()
        for nxt in adjacency.get(current, ()):
            if nxt not in depth:
                depth[nxt] = depth[current] + 1
                queue.append(nxt)
    return depth


def hreflang_issues(pages: pd.DataFrame, host: str) -> pd.DataFrame:
    clusters = {}
    for _, page in pages.iterrows():
        langs = split(page.get('hreflang_lang'))
        hrefs = [path_of(h, host) for h in split(page.get('hreflang_href'))]
        if langs:
            clusters[page['path']] = dict(zip(langs, hrefs))
    issues = []
    for path, cluster in clusters.items():
        if path not in cluster.values():
            issues.append({'path': path, 'issue': 'does not list itself'})
        if 'x-default' not in cluster:
            issues.append({'path': path, 'issue': 'no x-default'})
        for lang, target in cluster.items():
            if lang == 'x-default' or target == path:
                continue
            if target not in clusters:
                issues.append({'path': path, 'issue': f'{lang} → {target} has no hreflang (or was not crawled)'})
            elif path not in clusters[target].values():
                issues.append({'path': path, 'issue': f'{lang} → {target} does not link back'})
    return pd.DataFrame(issues, columns=['path', 'issue'])


def check_external(external: pd.DataFrame, out: Path, delay: float) -> pd.DataFrame:
    """Status of every distinct external URL, one HEAD request each.

    Share-intent URLs (they embed the page URL, so they differ per page and
    carry the local host here) are skipped: they are endpoints, not citations.
    """
    urls = sorted({h for h in external['href'] if '/sharing/' not in h and 'intent/' not in h})
    raw = out / 'external-headers.jl'
    if raw.exists():
        raw.unlink()
    adv.crawl_headers(
        urls,
        str(raw),
        custom_settings={
            'USER_AGENT': USER_AGENT,
            'DOWNLOAD_DELAY': delay,
            'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
            'LOG_FILE': str(out / 'scrapy-external.log'),
            'HTTPERROR_ALLOW_ALL': True,
        },
    )
    headers = pd.read_json(raw, lines=True)
    keep = [c for c in ['url', 'status', 'redirect_urls', 'redirect_reasons'] if c in headers]
    return headers[keep]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://localhost:3000')
    parser.add_argument('--out', required=True)
    parser.add_argument('--delay', type=float, default=0.5)
    args = parser.parse_args()

    base = args.base.rstrip('/')
    host = urlsplit(base).netloc
    out = Path(args.out)
    tables = out / 'advertools'
    tables.mkdir(parents=True, exist_ok=True)

    df = crawl(base, tables, args.delay)
    df['path'] = df['url'].map(lambda u: path_of(u, host))
    html = df[df['resp_headers_Content-Type'].fillna('').str.contains('text/html')]

    sitemap = adv.sitemap_to_df(f'{base}/sitemap.xml')
    sitemap_paths = set(sitemap['loc'].map(lambda u: path_of(u, host)))

    edges = link_graph(html, host)
    edges.to_csv(tables / 'links.csv', index=False)
    internal = edges[edges['internal']]
    depth = depths(edges)
    inlinks = internal[internal['source'] != internal['target']].groupby('target')['source'].nunique()

    # Redirected requests: advertools records the chain on the final URL.
    redirected = df[df['redirect_urls'].notna()] if 'redirect_urls' in df else df.iloc[0:0]
    redirect_sources = {
        path_of(u, host) for chain in redirected.get('redirect_urls', []) for u in split(chain)[:-1]
    } | {path_of(split(c)[0], host) for c in redirected.get('redirect_urls', []) if split(c)}

    status_by_path = dict(zip(df['path'], df['status']))
    linked = set(internal['target'])
    crawled_html = set(html['path'])

    pages = html.assign(
        depth=html['path'].map(depth),
        inlinks=html['path'].map(inlinks).fillna(0).astype(int),
        in_sitemap=html['path'].isin(sitemap_paths),
    )
    keep = ['path', 'status', 'depth', 'inlinks', 'in_sitemap', 'title', 'meta_desc', 'canonical', 'meta_robots', 'html_lang', 'h1']
    pages[[c for c in keep if c in pages]].sort_values(['depth', 'path']).to_csv(tables / 'pages.csv', index=False)

    broken = internal[internal['target'].map(lambda t: status_by_path.get(t, 0) >= 400)]
    broken.to_csv(tables / 'broken-internal.csv', index=False)
    to_redirect = internal[internal['target'].isin(redirect_sources)]
    to_redirect.to_csv(tables / 'links-to-redirects.csv', index=False)
    external = edges[~edges['internal'] & edges['href'].str.startswith('http')]
    external.to_csv(tables / 'external.csv', index=False)
    hreflang = hreflang_issues(pages, host)
    hreflang.to_csv(tables / 'hreflang-issues.csv', index=False)
    external_status = check_external(external, tables, max(args.delay, 1.0))
    external_status.to_csv(tables / 'external-status.csv', index=False)
    external_redirected = external_status[external_status.get('redirect_urls', pd.Series(dtype=str)).notna()] \
        if 'redirect_urls' in external_status else external_status.iloc[0:0]

    summary = {
        'base': base,
        'user_agent': USER_AGENT,
        'crawled_urls': int(len(df)),
        'crawled_html': int(len(html)),
        'status_counts': {str(k): int(v) for k, v in df['status'].value_counts().items()},
        'sitemap_urls': len(sitemap_paths),
        'sitemap_not_reached_by_links': sorted(sitemap_paths - linked - {'/'}),
        'linked_not_in_sitemap': sorted(p for p in (crawled_html - sitemap_paths) if status_by_path.get(p) == 200),
        'depth_histogram': {str(k): int(v) for k, v in pages['depth'].value_counts(dropna=False).sort_index().items()},
        'max_depth': int(pages['depth'].max()),
        'pages_with_one_inlink_or_less': sorted(pages.loc[pages['inlinks'] <= 1, 'path']),
        'internal_links': int(len(internal)),
        'broken_internal_links': int(len(broken)),
        'internal_links_to_redirects': int(len(to_redirect)),
        'redirect_sources': sorted(p for p in redirect_sources if p),
        'external_links': int(len(external)),
        'external_domains': int(external['href'].map(lambda h: urlsplit(h).netloc).nunique()),
        'hreflang_issues': int(len(hreflang)),
        'external_urls_checked': int(len(external_status)),
        'external_status_counts': {str(k): int(v) for k, v in external_status['status'].value_counts().items()},
        'external_redirected': int(len(external_redirected)),
        'external_non_200': sorted(
            f"{s} {u}" for u, s in zip(external_status['url'], external_status['status']) if s != 200
        ),
    }
    (out / 'summary.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
