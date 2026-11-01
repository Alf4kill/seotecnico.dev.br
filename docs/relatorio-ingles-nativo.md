# Inglês nativo nas páginas em inglês: relatório da sessão

Sessão de 27 a 30 de outubro de 2026. PRs #122 a #128, todos mergeados.

## O problema

Na revisão de `/en/project/how-a-page-is-made`, publicada logo depois do
#121, o dono notou que o inglês ainda soava traduzido. Os decalques já tinham
saído, mas o texto continuava com sequências de "the", frases abrindo com
"The", dois-pontos ligando orações e nenhum "you".

A causa era o método: quem escrevia o inglês tinha a prosa em português
aberta, e a estrutura da frase em português vinha junto. A correção foi
dividida em duas partes:

- **Parte A:** medir, mudar o método e refazer uma página como prova (#122).
- **Parte B:** refazer as outras 27 páginas em cinco lotes, um PR por lote,
  sempre a partir da `main` (#123 a #127).

## Parte A: medição e método (#122)

**Medição.** `register.mjs` mede cinco traços da prosa corrida.
`calibrate-register.mjs` aplica esses traços a 26 páginas escritas por
nativos (documentação do Search Central e do web.dev, mais relatos em
primeira pessoa de empresas e engenheiros dos EUA) e guarda só contagens,
nunca texto. Os limites ficam em `register-thresholds.json`:

| Traço | Mediana nativa | Limite | Mediana do site no #121 |
|---|---|---|---|
| "the" por 100 palavras | 5,7 | p90 8,32 | 9,5 |
| % de frases abrindo com "The" | 10,43 | p90 18,18 | 23,9 |
| dois-pontos por 100 frases | 1,56 | p90 6,52 | 25,0 |
| ponto e vírgula por 100 frases | 0 | p90 13,33 | 9,5 |
| "you" por 100 palavras | 1,52 | p10 0,44 | 0,6 |

Li à mão 15 parágrafos marcados, e 6 estavam bons. Com cerca de 40% de falso
positivo, todas as regras novas do `check-english.mjs` ficaram como WARN,
nunca como erro. O `--summary` ordena as páginas pela distância do registro
nativo, e essa ordem definiu os lotes da parte B.

**Método** (skill `english-version`):

1. **Ficha de fatos (papel A1).** Quem lê o português escreve, em notas e
   nunca em frases prontas, os fatos, números, ressalvas, links, títulos e
   onde entra cada bloco de código.
2. **Redator cego (papel B).** Escreve o inglês só a partir da ficha, sem
   abrir nada em `content/`.
3. **Leitor nativo cego (papel C).** Reescreve o que soa traduzido, também
   sem ver o português.
4. **Montagem.** `placeholders.mjs assemble` recoloca código e figuras byte a
   byte. `placeholders.mjs compare` lista o que sumiu ou apareceu em relação
   ao inglês publicado.
5. **Checagem de fidelidade (papel A2).** Compara com o português seção a
   seção: nenhuma afirmação perdida, nenhuma acrescentada, mesmas ressalvas,
   números e links. Roda `check-pair` e `check-english`.

O guia de estilo passou a seguir o Google developer documentation style
guide, com vírgula serial, "I" e nunca "we", e datas no formato americano no
texto (ISO em tabelas e logs).

## Parte B: os cinco lotes

| Lote | PR | Páginas | Merge |
|---|---|---|---|
| 1 | #123 | accessibility-tree, does-chatgpt-read-javascript, nextjs-metadata-api, does-llms-txt-work, nextjs-gtm, improve-lcp-nextjs | 2026-10-28 13:10 |
| 2 | #124 | how-ai-is-used (projeto), seo-audit-with-chatgpt, nextjs-high-lcp, structured-data-and-ai, nextjs-redirects-canonicals, nextjs-json-ld | 2026-10-28 15:25 |
| 3 | #125 | nextjs-hreflang, javascript-seo-google-vs-ai, sec-fetch-mode-header, nextjs-inp, seo-testing-pre-registration, which-ai-assistants-run-javascript | 2026-10-28 20:26 |
| 4 | #126 | next-image-seo, screaming-frog-free-version, scaled-content-abuse, nextjs-ssr-ssg-isr, chatgpt-cant-access-website, guia pilar technical-seo-nextjs | 2026-10-29 01:29 |
| 5 | #127 | detect-ai-crawlers, nextjs-dynamic-sitemap, how-a-page-is-made (projeto), estudo de caso ai-crawler-detection | 2026-10-29 09:58 |

O lote 3 começou empilhado sobre o lote 2. Quando o #124 foi mergeado, o dono
pediu lotes separados, e cada lote seguinte saiu de um branch próprio a
partir da `main`.

### Como cada lote foi feito

- Cada página passou pelos cinco passos acima, com agentes em paralelo. Os
  papéis ficavam num `ROLES.md` no scratchpad da sessão, fora do repositório.
- **Um commit por página**, mais um commit de log no fim do lote.
- **Antes de cada commit:**
  - compilação MDX;
  - contagem de LF solto (os arquivos são CRLF na árvore de trabalho);
  - `check-pair`;
  - diff dos blocos de código entre português e inglês, porque código é
    copiado com os comentários em português, nunca traduzido.
- **Antes de cada PR:** `check-english --published`, vitest (512 testes),
  lint e tsc.
- **No log** (`docs/experiment-log.md`): cada lote ganhou uma linha
  (105 a 109) e fechou a linha anterior com o corte, que é o horário do
  deploy de produção do PR anterior, tirado da API de deployments do GitHub.
- O português e o `dateModified` não mudaram em nenhuma página, porque é uma
  revisão de idioma.

### O que mudou além do registro

**Links seguem `TRANSLATION_PAIRS`.** Muitas páginas em inglês apontavam para
`/en/case-studies/ai-crawler-detection` onde o português linka um artigo.
Agora apontam para o par em inglês desse artigo (`detect-ai-crawlers` ou
`does-chatgpt-read-javascript`). Links que o inglês antigo tinha perdido
voltaram: o artigo de SSR/SSG/ISR, o pilar e o da Metadata API. O único link
para o estudo de caso que ficou é a frase de `detect-ai-crawlers`, porque o
estudo existe só em inglês e esse é o único artigo que leva até ele.

**Afirmações que o inglês antigo acrescentou foram removidas.** Exemplos:

- "Nobody noticed until…";
- uma frase sobre relatórios para clientes (§13);
- o "track 6" e o "third track" de um guia que não numera as partes;
- uma cláusula da LGPD que sugeria que a lei exige o modo avançado do
  Consent Mode;
- alt em inglês nas páginas em inglês;
- "9 impressions" e "explicitly";
- "nothing is published before it's measured";
- "all ten also have an English version";
- "every correction on record", "verbatim" e "always".

**O que o inglês antigo tinha perdido voltou.** Exemplos:

- o escopo pt-BR do conselho desatualizado sobre preload;
- o escopo brasileiro das "regras" de conteúdo;
- "published" para os capítulos do guia;
- "and publishes the numbers";
- "the strong form" e "confound";
- o plural "new articles".

**Fatos corrigidos com base no registro do repositório:**

- **sec-fetch-mode-header:** qual requisição levava `Accept: */*`. A resposta
  saiu de `docs/lab-control-rounds.md`.
- **nextjs-metadata-api:** o cartão da marca virou route handler, e a frase
  foi para o passado.
- **next-image-seo:** o bloco do sitemap voltou a ter o comentário em
  português (`// …um ativo por artigo`).

**O estudo de caso** (`ai-crawler-detection`) não tem par em português, então
a ficha e a checagem usaram `docs/experiment-log.md`,
`docs/detection-experiment.md` e `docs/lab-control-rounds.md` como fonte. Pela
política de afirmações (§10), nada falso ficou, e só entrou o necessário
para cada afirmação ficar verdadeira:

- **GPTBot:** três requisições a três caminhos proibidos numa mesma data. O
  texto dizia "one verified fetch".
- **62×:** compara redes não declaradas com redes declaradas e proibidas
  (436 contra 7).
- **"Every visit":** são as 10 de 10 do controle.
- **Os 64 eventos sem assinante:** contagem da leitura de 28 dias, em 13 de
  setembro.
- **Códigos das rodadas:** as rodadas 01 a 03 saíram com os códigos da
  rodada 00.
- **`Sec-Fetch-*`:** deixou de ser chamado de exclusivo de navegador.
- **"What is measured now":** a v2 (H7 a H13) está registrada, não
  construída, e o que se mede hoje é a H14.
- **Decisão do dono (30/10):** a lista continua com os seis bugs do piloto.
  O sétimo defeito, o `fetch` do Node e o `Sec-Fetch-Mode` do PR #95,
  apareceu depois do piloto e não muda nenhum veredito. O PR #128 registra
  essa decisão e fecha a linha 109 com o corte do #127.

**Títulos:** alguns títulos no formato "The X" foram renomeados para
descrever a seção. Antes de cada renomeação, conferi com grep que nenhum link
usava a âncora antiga.

## Resultado

Valores do `check-english.mjs --published --summary` depois do lote 5:

- As 28 páginas em inglês estão com 0 ponto e vírgula.
- Os dois-pontos ficaram em no máximo 5,4 por 100 frases. Antes, iam de 6,8
  a 41,7.
- Nenhuma página passa mais de 1 dos 5 limites. Antes, cada página passava 2
  a 4.
- O "the" ficou entre 5,4 e 9,9 por 100 palavras. Antes, ia de 6,4 a 11,3.
  Sete páginas continuam acima do p90 (8,32): javascript-seo-google-vs-ai,
  which-ai-assistants-run-javascript, nextjs-hreflang, nextjs-inp,
  accessibility-tree, seo-audit-with-chatgpt e structured-data-and-ai. Sobram termos fixos do
  laboratório ("the log", "the round", "the tree"), e cortar mais exigiria
  apagar artigos de que as frases precisam.

## Pendências do dono

Estes itens estão nos dois idiomas ou no código. Ficaram fora porque esta era
uma revisão de idioma:

1. **gtm:** "bounce rate cai artificialmente". Se o GA4 registra só a página
   de entrada, a rejeição deveria subir.
2. **does-llms-txt-work:** a janela de 90 dias fechou em 23 de outubro, mas
   o texto ainda promete o veredito "quando a janela fechar".
3. **pre-registration:** cita "contas de clientes" (§13).
4. **hreflang:** diz que ainda não há veredito, mas as linhas 59 e 60 do log
   têm um de 11 de setembro. Também chama um trecho de um par só de "mapa de
   produção".
5. **which-ai:** fala em "seis empresas" (são 5 empresas e 6 sondas) e em
   "9 a 12 dias" (a tabela mostra de 9 a 11).
6. **screaming-frog:** o trecho de `crawl_audit.py` não bate com o arquivo, e
   "quatro dias" deveria ser três.
7. **ssr-ssg-isr:** o português ainda diz, no presente, que a rota de OG é a
   única sob demanda.
8. **ia-nao-consegue-acessar-site:** o português linka o próprio par em
   inglês.
9. **how-a-page-is-made:** a contagem "263 ocorrências" não traz o SHA do
   commit.
10. **detect-ai-crawlers:** usa 57 e 58 dias para a mesma janela.
11. **Código e datas entre os idiomas:**
    - código divergente entre PT e EN em accessibility-tree, improve-lcp e
      metadata-api;
    - `datePublished` diferente entre PT e EN em vários pares.
