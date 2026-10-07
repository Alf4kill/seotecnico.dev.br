// ─────────────────────────────────────────────────────────────────────────────
// Fetch Metadata (`Sec-Fetch-*`) como sinal de navegador.
//
// Todo navegador com suporte (Chrome 76+, Firefox 90+, Safari 16.4+) envia os
// quatro cabeçalhos em requisições HTTPS, e `Sec-Fetch-Dest` vem sempre junto
// com `Sec-Fetch-Mode`. Um cliente HTTP fora do navegador não precisa enviar
// nenhum, mas pode: o `fetch` nativo do Node (undici) acrescenta
// `Sec-Fetch-Mode: cors` em toda requisição, sem `Sec-Fetch-Dest` (conferido
// no Node 22.16 em 2026-10-07). Até essa data o proxy tratava a presença de
// `Sec-Fetch-Mode` sozinha como sinal de navegador, então um crawler escrito
// com o `fetch` do Node que pedisse HTML caía em `browser-like` e em
// `has_sec_fetch = true` (docs/experiment-log.md, 2026-10-07).
//
// O sinal agora exige os dois. Continua sendo indício, não identidade:
// qualquer cliente pode mandar os dois cabeçalhos com o valor que quiser.
// ─────────────────────────────────────────────────────────────────────────────

/** A requisição traz o par Mode + Dest que um navegador sempre manda junto. */
export function hasBrowserFetchMetadata(headers: Headers): boolean {
  return headers.has('sec-fetch-mode') && headers.has('sec-fetch-dest')
}
