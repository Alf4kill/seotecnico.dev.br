// ─────────────────────────────────────────────────────────────────────────────
// HTML bruto × renderizado, de fora: o que o servidor entrega × o que o DOM
// tem depois que o JavaScript roda.
//
// Para cada página do arquivo de alvos:
//   1. lê o robots.txt da origem (uma vez); caminho bloqueado não é pedido;
//   2. pede o HTML bruto (GET, node:https, segue até 5 redirects);
//   3. extrai os sinais desse HTML num Chromium com JavaScript desligado e
//      todo subrecurso abortado: é o documento como o servidor mandou;
//   4. abre a mesma URL num Chromium com JavaScript, viewport de celular,
//      espera o `load` e mais RENDER_WAIT_MS, e extrai os mesmos sinais do DOM;
//   5. compara: title, description, canonical, robots, lang, H1 e tipos de
//      JSON-LD (o "head" que conta para indexação), e conta H2, palavras,
//      links internos, imagens e blocos de JSON-LD nos dois lados.
// A mesma função de extração roda nos dois lados, então uma diferença é do
// documento, não do parser. Base: docs/research/2026-11-13-raw-vs-rendered.md.
//
// Por que node:https e não fetch no passo 2: o fetch do Node (undici)
// acrescenta `sec-fetch-mode: cors` a toda requisição — o defeito medido no
// PR #95.
//
// Regras de coleta (docs/proposals/case-studies-content.md §3–§4):
// - User-Agent declarado nos dois passos (nunca o de um navegador);
// - uma página por vez, pausa mínima de PAUSE_MS entre páginas;
// - no render, pedidos a hosts de medição (analytics, pixels) são abortados,
//   para a visita não entrar nas métricas do site. Consequência declarada:
//   conteúdo que só um desses scripts injetaria (JSON-LD via GTM, por
//   exemplo) não aparece no renderizado;
// - nada de busca no Google; só as origens do arquivo de alvos.
//
// Saída: <out>/raw.json (tudo, com URLs — local, ver .gitignore) e
// <out>/summary.json (versionável). Alvos de terceiros saem só pelo código
// S1–S4 e pelo tipo de página, com palavras arredondadas à dezena e bytes em
// KB. Alvos `public: true` (este site) saem com valores exatos e caminhos.
//
//   node scripts/raw-vs-rendered.mjs --targets audits/case-studies/raw-vs-rendered.local.json
//   node scripts/raw-vs-rendered.mjs --targets <arquivo> --out audits/case-studies/raw-vs-rendered-2026-11-13
//   node scripts/raw-vs-rendered.mjs --summarize --out audits/case-studies/raw-vs-rendered-2026-11-13
//
// Formato do arquivo de alvos: audits/case-studies/raw-vs-rendered.example.json.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import zlib from "node:zlib";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const TODAY = new Date().toISOString().slice(0, 10);
const TARGETS = arg("targets");
const OUT = arg(
  "out",
  path.join("audits", "case-studies", `raw-vs-rendered-${TODAY}`),
);
const ONLY = arg("only");
const UA_TOKEN = "seotecnico-render-compare";
const UA = `${UA_TOKEN}/1.0 (+https://seotecnico.dev.br)`;
const PAUSE_MS = 1500;
const RENDER_WAIT_MS = 5000;
const MAX_BYTES = 5_000_000;
// Hosts de medição abortados no render (ver regras acima).
const MEASUREMENT_HOSTS = [
  "googletagmanager.com",
  "google-analytics.com",
  "analytics.google.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com",
  "clarity.ms",
  "hotjar.com",
  "hotjar.io",
  "tiktok.com",
  "linkedin.com",
  "licdn.com",
];

if (!TARGETS && !argv.includes("--summarize")) {
  console.error(
    "uso: node scripts/raw-vs-rendered.mjs --targets <arquivo.json> [--out <pasta>] [--only <código>] | --summarize --out <pasta>",
  );
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;

/** GET sem seguir redirect. Cabeçalhos: só User-Agent, Accept e Accept-Encoding. */
function get(url, accept = "text/html") {
  requests++;
  const lib = url.startsWith("https:") ? https : http;
  return new Promise((resolve) => {
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": UA,
          Accept: accept,
          "Accept-Encoding": "gzip, br",
        },
        timeout: 30_000,
      },
      (res) => {
        const chunks = [];
        let size = 0;
        let stream = res;
        const enc = res.headers["content-encoding"];
        if (enc === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());
        stream.on("data", (c) => {
          size += c.length;
          if (size <= MAX_BYTES) chunks.push(c);
        });
        stream.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            bytes: size,
          }),
        );
        stream.on("error", (e) => resolve({ error: String(e) }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => resolve({ error: String(e) }));
  });
}

async function follow(url, accept) {
  const hops = [];
  let current = url;
  for (let i = 0; i <= 5; i++) {
    const res = await get(current, accept);
    if (res.error) return { hops, error: res.error };
    hops.push(res.status);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(res.headers.location, current).href;
      continue;
    }
    return { hops, final: res, finalUrl: current };
  }
  return { hops, error: "too many redirects" };
}

// ── robots.txt (mesma leitura de scripts/sitemap-audit.mjs) ────────────────
function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (key === "allow" || key === "disallow"))
        current.rules.push({ allow: key === "allow", path: value });
    }
  }
  return groups;
}

function ruleMatches(rulePath, urlPath) {
  if (rulePath === "") return false;
  const anchored = rulePath.endsWith("$");
  const pattern = (anchored ? rulePath.slice(0, -1) : rulePath)
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${pattern}${anchored ? "$" : ""}`).test(urlPath);
}

function robotsAllows(groups, urlPath) {
  const mine = groups.filter((g) =>
    g.agents.some((a) => a !== "*" && UA_TOKEN.startsWith(a)),
  );
  const chosen = mine.length
    ? mine
    : groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const rule of chosen.flatMap((g) => g.rules)) {
    if (!ruleMatches(rule.path, urlPath)) continue;
    if (
      !best ||
      rule.path.length > best.path.length ||
      (rule.path.length === best.path.length && rule.allow)
    )
      best = rule;
  }
  return best ? best.allow : true;
}

// ── Extração (roda dentro da página, igual nos dois lados) ─────────────────
function extract() {
  const meta = (name) =>
    [...document.querySelectorAll(`meta[name="${name}" i]`)].map((m) =>
      (m.getAttribute("content") || "").trim(),
    );
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const jsonld = [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ];
  const types = [];
  let jsonldInvalid = 0;
  for (const s of jsonld) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        if (node["@type"]) types.push(...[].concat(node["@type"]));
        if (node["@graph"]) walk(node["@graph"]);
      };
      walk(JSON.parse(s.textContent));
    } catch {
      jsonldInvalid++;
    }
  }
  // Texto: o corpo sem script, style, noscript, template e svg. noscript sai
  // dos dois lados porque, sem JavaScript, o parser o trata como elementos e,
  // com JavaScript, como texto cru.
  const body = document.body ? document.body.cloneNode(true) : null;
  let words = 0;
  if (body) {
    body
      .querySelectorAll("script,style,noscript,template,svg")
      .forEach((n) => n.remove());
    words = norm(body.textContent)
      .split(" ")
      .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  }
  // Links e imagens dentro de <noscript> ficam de fora dos dois lados: sem
  // JavaScript eles viram elementos e seriam contados em dobro no bruto.
  const live = (el) => !el.closest("noscript");
  const host = location.host;
  const links = new Set();
  for (const a of [...document.querySelectorAll("a[href]")].filter(live)) {
    try {
      const u = new URL(a.getAttribute("href"), location.href);
      if (u.host === host && /^https?:$/.test(u.protocol))
        links.add(u.pathname + u.search);
    } catch {}
  }
  const imgs = [...document.querySelectorAll("img")].filter(live);
  const noscriptImgs = [...document.querySelectorAll("noscript")].reduce(
    (n, el) =>
      n +
      (el.querySelectorAll("img").length ||
        (el.textContent.match(/<img\b/gi) || []).length),
    0,
  );
  const realSrc = (i) => {
    const s = i.getAttribute("src") || "";
    return s !== "" && !s.startsWith("data:");
  };
  return {
    title: norm(document.title),
    description: meta("description")[0] ?? null,
    canonical: [...document.querySelectorAll('link[rel~="canonical" i]')].map(
      (l) => l.getAttribute("href"),
    ),
    robots: meta("robots")
      .concat(meta("googlebot"))
      .map((s) => s.toLowerCase()),
    lang: document.documentElement.getAttribute("lang"),
    h1: [...document.querySelectorAll("h1")].map((h) => norm(h.textContent)),
    h2: document.querySelectorAll("h2").length,
    jsonldBlocks: jsonld.length,
    jsonldInvalid,
    jsonldTypes: [...new Set(types)].sort(),
    words,
    links: [...links].sort(),
    images: imgs.length,
    imagesWithRealSrc: imgs.filter(realSrc).length,
    imagesWithDataSrc: imgs.filter(
      (i) => i.hasAttribute("data-src") || i.hasAttribute("data-lazy-src"),
    ).length,
    imagesEmptyAlt: imgs.filter(
      (i) => (i.getAttribute("alt") ?? "").trim() === "",
    ).length,
    noscriptImages: noscriptImgs,
  };
}

const HEAD_FIELDS = [
  "title",
  "description",
  "canonical",
  "robots",
  "lang",
  "h1",
  "jsonldTypes",
];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function compare(raw, rendered) {
  const diff = HEAD_FIELDS.filter((f) => !same(raw[f], rendered[f]));
  const rawLinks = new Set(raw.links);
  const renLinks = new Set(rendered.links);
  return {
    headEqual: diff.length === 0,
    headDiff: diff,
    h2: [raw.h2, rendered.h2],
    words: [raw.words, rendered.words],
    jsonldBlocks: [raw.jsonldBlocks, rendered.jsonldBlocks],
    links: [raw.links.length, rendered.links.length],
    linksOnlyRaw: raw.links.filter((l) => !renLinks.has(l)).length,
    linksOnlyRendered: rendered.links.filter((l) => !rawLinks.has(l)).length,
    images: [raw.images, rendered.images],
    imagesWithRealSrc: [raw.imagesWithRealSrc, rendered.imagesWithRealSrc],
  };
}

// ── Coleta ─────────────────────────────────────────────────────────────────
async function collect() {
  const { chromium, devices } = await import("playwright");
  const targets = JSON.parse(fs.readFileSync(TARGETS, "utf8")).filter(
    (t) => !ONLY || t.code === ONLY,
  );
  const browser = await chromium.launch();
  const phone = devices["Pixel 7"];
  const rawCtx = await browser.newContext({
    javaScriptEnabled: false,
    userAgent: UA,
  });
  const renCtx = await browser.newContext({
    ...phone,
    userAgent: UA,
    serviceWorkers: "block",
  });
  await renCtx.route("**/*", (route) => {
    const host = new URL(route.request().url()).host;
    if (MEASUREMENT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
      return route.abort();
    return route.continue();
  });
  const out = {
    date: TODAY,
    collectedAt: new Date().toISOString(),
    userAgent: UA,
    renderWaitMs: RENDER_WAIT_MS,
    pauseMs: PAUSE_MS,
    viewport: "Pixel 7 (Playwright)",
    measurementHostsBlocked: MEASUREMENT_HOSTS,
    targets: [],
  };
  for (const t of targets) {
    const robotsRes = await follow(
      new URL("/robots.txt", t.origin).href,
      "text/plain",
    );
    const groups =
      robotsRes.final && robotsRes.final.status === 200
        ? parseRobots(robotsRes.final.body)
        : [];
    const result = {
      ...t,
      robotsStatus: robotsRes.final ? robotsRes.final.status : null,
      pages: [],
    };
    for (const p of t.paths) {
      const url = new URL(p.path, t.origin).href;
      const entry = { path: p.path, kind: p.kind };
      if (!robotsAllows(groups, new URL(url).pathname)) {
        result.pages.push({ ...entry, skipped: "robots.txt" });
        continue;
      }
      await sleep(PAUSE_MS);
      const res = await follow(url);
      entry.chain = res.hops;
      if (res.error || res.final.status !== 200) {
        entry.error = res.error || `status ${res.final.status}`;
        result.pages.push(entry);
        continue;
      }
      entry.finalUrl = res.finalUrl;
      entry.rawBytes = res.final.bytes;
      // Lado bruto: o corpo recebido, servido de volta ao Chromium sem JS.
      const rp = await rawCtx.newPage();
      await rp.route("**/*", (route) =>
        route.request().url() === res.finalUrl
          ? route.fulfill({
              status: 200,
              contentType: "text/html; charset=utf-8",
              body: res.final.body,
            })
          : route.abort(),
      );
      await rp.goto(res.finalUrl, { waitUntil: "domcontentloaded" });
      entry.raw = await rp.evaluate(extract);
      await rp.close();
      // Lado renderizado.
      await sleep(PAUSE_MS);
      const page = await renCtx.newPage();
      const apiCalls = [];
      page.on("request", (r) => {
        if (["fetch", "xhr"].includes(r.resourceType()))
          apiCalls.push(
            new URL(r.url()).host === new URL(res.finalUrl).host
              ? "same-origin"
              : "other-origin",
          );
      });
      try {
        const resp = await page.goto(res.finalUrl, {
          waitUntil: "load",
          timeout: 45_000,
        });
        entry.renderStatus = resp ? resp.status() : null;
        await page.waitForTimeout(RENDER_WAIT_MS);
        entry.rendered = await page.evaluate(extract);
        entry.apiCalls = {
          sameOrigin: apiCalls.filter((c) => c === "same-origin").length,
          otherOrigin: apiCalls.filter((c) => c === "other-origin").length,
        };
        entry.compare = compare(entry.raw, entry.rendered);
      } catch (e) {
        entry.renderError = String(e).slice(0, 200);
      }
      await page.close();
      console.log(
        t.code,
        p.kind,
        entry.compare
          ? entry.compare.headEqual
            ? "head igual"
            : `head difere: ${entry.compare.headDiff.join(",")}`
          : entry.renderError || entry.error,
      );
      result.pages.push(entry);
    }
    out.targets.push(result);
  }
  await browser.close();
  out.requests = requests;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "raw.json"), JSON.stringify(out, null, 2));
  return out;
}

// ── Resumo versionável ──────────────────────────────────────────────────────
const r10 = (n) => Math.round(n / 10) * 10;
const kb = (n) => Math.round(n / 1024);

function summarize(raw) {
  const targets = raw.targets.map((t) => {
    const pub = t.public === true;
    const pages = t.pages.map((p) => {
      const base = { kind: p.kind, ...(pub ? { path: p.path } : {}) };
      if (p.skipped || p.error || p.renderError)
        return { ...base, skipped: p.skipped, error: p.error || p.renderError };
      const c = p.compare;
      const w = (n) => (pub ? n : r10(n));
      return {
        ...base,
        rawKB: kb(p.rawBytes),
        headEqual: c.headEqual,
        headDiff: c.headDiff,
        ...(pub || c.headEqual
          ? {}
          : {
              headDiffValues: c.headDiff
                .filter((f) => ["lang", "robots", "jsonldTypes"].includes(f))
                .map((f) => ({
                  field: f,
                  raw: p.raw[f],
                  rendered: p.rendered[f],
                })),
            }),
        ...(pub
          ? {
              headDiffValues: c.headDiff.map((f) => ({
                field: f,
                raw: p.raw[f],
                rendered: p.rendered[f],
              })),
            }
          : {}),
        titleRawEmpty: p.raw.title === "",
        h1Raw: p.raw.h1.length,
        h1Rendered: p.rendered.h1.length,
        h2: c.h2,
        words: c.words.map(w),
        jsonldBlocks: c.jsonldBlocks,
        links: c.links,
        linksOnlyRaw: c.linksOnlyRaw,
        linksOnlyRendered: c.linksOnlyRendered,
        images: c.images,
        imagesWithRealSrc: c.imagesWithRealSrc,
        imagesWithDataSrc: [
          p.raw.imagesWithDataSrc,
          p.rendered.imagesWithDataSrc,
        ],
        noscriptImages: p.raw.noscriptImages,
        apiCalls: p.apiCalls,
      };
    });
    const ok = pages.filter((p) => p.headEqual !== undefined);
    return {
      code: t.code,
      label: t.label,
      ...(pub ? { origin: t.origin } : {}),
      robotsStatus: t.robotsStatus,
      pagesRead: ok.length,
      headEqual: ok.filter((p) => p.headEqual).length,
      pages,
    };
  });
  return {
    date: raw.date,
    collectedAt: raw.collectedAt,
    userAgent: raw.userAgent,
    renderWaitMs: raw.renderWaitMs,
    pauseMs: raw.pauseMs,
    viewport: raw.viewport,
    measurementHostsBlocked: raw.measurementHostsBlocked,
    requestsRawSide: raw.requests,
    method:
      "docs/research/2026-11-13-raw-vs-rendered.md; script scripts/raw-vs-rendered.mjs",
    rounding:
      "third-party targets: words to the nearest 10, raw size in KB, no paths",
    targets,
  };
}

const raw = argv.includes("--summarize")
  ? JSON.parse(fs.readFileSync(path.join(OUT, "raw.json"), "utf8"))
  : await collect();
const summary = summarize(raw);
fs.writeFileSync(
  path.join(OUT, "summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
for (const t of summary.targets)
  console.log(
    `${t.code} ${t.label}: head igual em ${t.headEqual} de ${t.pagesRead}`,
  );
