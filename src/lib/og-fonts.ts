import fs from 'node:fs'
import path from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// Fontes das imagens OG. O Satori (next/og) não lê woff2 — nem as fontes que o
// next/font serve ao site —, então os mesmos desenhos entram aqui em .woff,
// vindos dos pacotes @fontsource (licença OFL, como os originais).
//
// Lidas do disco no build: as rotas de imagem são force-static, então isto
// roda uma vez por imagem gerada, nunca por requisição.
// ─────────────────────────────────────────────────────────────────────────────

function load(pkg: string, file: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file))
}

export function ogFonts() {
  return [
    { name: 'Space Grotesk', data: load('space-grotesk', 'space-grotesk-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
    { name: 'IBM Plex Mono', data: load('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  ]
}
