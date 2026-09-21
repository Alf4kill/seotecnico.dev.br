import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// Texto da página /design (e /en/design). O texto em português é o do próprio
// projeto de design (prancha "Manifesto do design"); o inglês é tradução.
//
// Duas mudanças deliberadas em relação à prancha, pela regra "número medido só
// entra com fonte e data ao lado":
//  - a barra de proporção de área (78/16/4/2) é intenção de projeto, não
//    medição — a legenda diz isso;
//  - a tabela de contraste não é digitada: é calculada no build a partir de
//    lib/design-tokens.ts (ver ContrastTable).
// ─────────────────────────────────────────────────────────────────────────────

/** Data da última revisão do texto desta página — atualizar ao editá-lo. */
export const MANIFESTO_REVISED = '2026-09-19'

export interface ManifestoCopy {
  eyebrow: string
  heroWords: [string, string, string]
  lead: string
  schoolsLabel: string
  schools: string[]
  atmosphereLabel: string
  atmosphere: string[]
  thesis: { label: string; title: string; paragraphs: string[] }
  lineage: {
    label: string
    title: string
    where: string
    cards: { school: string; years: string; title: string; text: string; where: string }[]
  }
  color: {
    label: string
    title: string
    text: string
    areaCaption: string
    areaNote: string
    tableTitle: string
    tableCaption: string
    headers: [string, string, string, string, string]
    roles: Record<string, string>
    fails: string
  }
  atmosphereSection: {
    label: string
    title: [string, string]
    paragraphs: string[]
    tags: string[]
    morseLabel: string
    morseAria: string
    eclipseAria: string
  }
  unit: {
    label: string
    title: string
    lead: string
    paragraphs: string[]
    roles: { label: string; text: string }[]
    strip: [string, string, string]
    robotAria: string
  }
  rules: {
    label: string
    title: string
    no: string
    yes: string
    enforced: string
    items: { kind: 'no' | 'yes'; text: string; check: string }[]
  }
  system: {
    label: string
    title: string
    text: string
    typeTitle: string
    specimens: { meta: string; sample: string; kind: 'display' | 'section' | 'body' | 'mono' }[]
    componentsTitle: string
    buttons: [string, string, string]
    noteLabel: string
    note: string
    gridTitle: string
    gridLegend: [string, string, string]
  }
  cta: { blog: string; blogHref: string; code: string }
  footer: string
}

export const MANIFESTO_COPY: Record<Lang, ManifestoCopy> = {
  'pt-BR': {
    eyebrow: 'Por que este site é assim',
    heroWords: ['Retro', 'futuro', 'suíço'],
    lead:
      'Esta página é o colofão do site: ela mostra, com os próprios elementos ampliados, de onde vem cada decisão visual do blog. Nas outras telas o estilo é contido. Aqui ele é exibido em tamanho de cartaz.',
    schoolsLabel: 'Escolas citadas',
    schools: ['Bauhaus', 'De Stijl', 'Estilo Tipográfico Internacional', 'Escola Suíça'],
    atmosphereLabel: 'Referência de atmosfera',
    atmosphere: ['Ficção científica de estação', 'Painéis de instrumento', 'Evento Lone Trail, Arknights'],
    thesis: {
      label: '01 · Tese',
      title: 'O retrofuturismo que me interessa não é nostalgia. É um método de leitura.',
      paragraphs: [
        'As interfaces de ficção científica que envelheceram bem são as que foram desenhadas como instrumento: uma grade fixa, rótulos curtos, números grandes, nenhuma decoração que não informe. É exatamente o que a escola suíça pedia trinta anos antes — e é o que um site sobre medição técnica precisa ser.',
        'Por isso o site não tem cromado, brilho, ruído de tela nem tipografia de foguete. O futuro aqui aparece na forma como a informação é organizada, não em textura. O que resta de retrô é o vocabulário: marcas de canto, códigos monoespaçados, faixas de alerta, formas primárias.',
      ],
    },
    lineage: {
      label: '02 · Linhagem',
      title: 'Quatro escolas, quatro heranças',
      where: 'Onde aparece →',
      cards: [
        {
          school: 'Bauhaus',
          years: '1919 — 1933',
          title: 'Círculo, quadrado, triângulo como linguagem',
          text: 'As formas primárias não são enfeite: elas são o alfabeto das categorias. No blog, cada eixo temático recebe uma delas, sempre a mesma, em qualquer tamanho. Nenhum ícone ilustrativo entra no sistema.',
          where: 'marcadores de categoria, glifos de filtro, ferramentas, favicon',
        },
        {
          school: 'De Stijl',
          years: '1917 — 1931',
          title: 'Só ângulos retos, e assimetria de propósito',
          text: 'Nenhum canto arredondado em nenhum componente do site. Os blocos se equilibram por peso desigual, nunca por centralização. As primárias entram rebaixadas, como sinalização de estado — vermelho é regressão, azul é referência.',
          where: 'cantos vivos, faixas de topo dos cartões, cores de estado',
        },
        {
          school: 'Estilo Tipográfico Internacional',
          years: '1950 →',
          title: 'A grade modular manda em tudo',
          text: 'Doze colunas, goteira de 24. Texto alinhado à esquerda com bandeira à direita, nunca justificado. A medida da linha fica presa entre 62 e 72 caracteres, mesmo que sobre espaço na tela.',
          where: 'toda a diagramação, índice do artigo, rodapé',
        },
        {
          school: 'Escola Suíça',
          years: 'Zurique / Basileia',
          title: 'Hierarquia por escala, nunca por enfeite',
          text: 'A numeração grande das seções vem daqui, junto com os fios finos que separam blocos e a recusa a usar cor para criar importância. Se um item precisa de destaque, ele cresce — não fica colorido.',
          where: 'índice do blog, títulos de seção, fios divisores',
        },
      ],
    },
    color: {
      label: '03 · Cor',
      title: 'Escuro por decisão de leitura, não por moda',
      text: 'Os artigos são longos e cheios de código. Um fundo claro em tela grande, à noite, cansa antes do terceiro bloco. O grafite #0E1116 sustenta sessões longas e faz o ciano e o âmbar funcionarem como sinal, não como ruído — eles só aparecem em áreas pequenas ou como texto.',
      areaCaption: 'Proporção de área por cor',
      areaNote: 'intenção de projeto, não medição',
      tableTitle: 'Contraste medido, não suposto',
      tableCaption:
        'Razão de contraste WCAG de cada cor de texto sobre as três superfícies, calculada a partir dos tokens a cada build. O mínimo para texto é 4,5:1. As duas reprovações são o motivo de existirem as duas variantes ao lado delas.',
      headers: ['Token', 'Uso', 'Fundo', 'Cartão', 'Código'],
      roles: {
        foreground: 'títulos',
        body: 'corpo de leitura',
        muted: 'apoio',
        label: 'rótulo mono',
        labelOnCode: 'rótulo sobre código',
        primary: 'acento, link',
        accent: 'alerta, em medição',
        dangerText: 'regressão (texto)',
        danger: 'vermelho De Stijl (forma)',
      },
      fails: 'reprova',
    },
    atmosphereSection: {
      label: '04 · Atmosfera',
      title: ['A referência que deu o tom: ', 'Lone Trail'],
      paragraphs: [
        'O ponto de partida foi o evento Lone Trail, de Arknights — não pelo desenho em si, que pertence a quem o fez, mas pela atmosfera: uma estação isolada, painéis de instrumento lendo números no escuro, tipografia industrial e um ciano frio recortado por âmbar de alerta. Silêncio, precisão e uma leve melancolia de missão longa.',
        'O que atravessou para cá foi só o vocabulário funcional: rótulos curtos em caixa alta, códigos de identificação, marcas de canto que enquadram informação importante e o hábito de mostrar o estado de cada coisa. Nenhum elemento gráfico foi copiado.',
      ],
      tags: ['Isolamento', 'Instrumentação', 'Ciano frio · âmbar de alerta', 'Registro contínuo'],
      morseLabel: 'Transmissão · sinal de despedida',
      morseAria: 'Sinal em código morse: --. --- --- -.. -. .. --. .... -',
      eclipseAria:
        'Composição de eclipse: um corpo escuro com limbo iluminado em ciano, um segundo corpo menor sobreposto e um brilho de quatro pontas no centro.',
    },
    unit: {
      label: '05 · Unidade',
      title: 'ST‑01, a unidade de bancada',
      lead: 'Uma parte deste site — texto, código e este próprio desenho — é produzida com apoio de IA. Em vez de esconder isso num rodapé, ele virou personagem.',
      paragraphs: [
        'A ST‑01 é montada exclusivamente com o alfabeto do site: círculo, quadrado e triângulo, nas mesmas quatro cores do sistema. Não há uma curva sequer que não seja um arco de círculo. É literalmente o mesmo conjunto de peças que forma os marcadores de categoria, remontado em outra escala.',
        'O visor ciano é o mesmo fio de acento que atravessa o site; o triângulo âmbar na antena é o marcador de alerta. Ela representa o acordo de trabalho aqui: a máquina executa e rascunha, a decisão editorial e a medição continuam humanas.',
      ],
      roles: [
        { label: 'Executa', text: 'Rascunho, refatoração, varredura de dados' },
        { label: 'Sinaliza', text: 'Marca o que ainda não foi verificado por um humano' },
        { label: 'Não decide', text: 'Nenhum número publicado vem de estimativa da máquina' },
      ],
      strip: ['Unidade ST‑01 · bancada', 'Peças: 3 formas · 4 cores', 'Estado: em serviço'],
      robotAria:
        'Robô ST-01 desenhado apenas com círculo, quadrado e triângulo: cabeça quadrada com visor ciano, antena triangular âmbar e painel de peito com blocos primários.',
    },
    rules: {
      label: '06 · Regras',
      title: 'O que o sistema proíbe',
      no: 'Não',
      yes: 'Sim',
      enforced: 'verificado no CI',
      items: [
        { kind: 'no', text: 'Fundo claro em área grande, em nenhuma tela', check: 'tests/seo/contrast.spec.ts' },
        { kind: 'no', text: 'Degradê, sombra difusa ou brilho como decoração', check: 'src/design-rules.test.ts' },
        { kind: 'no', text: 'Canto arredondado em qualquer componente', check: 'src/design-rules.test.ts' },
        { kind: 'no', text: 'Emoji, ícone ilustrativo ou mascote fora da ST‑01', check: 'revisão' },
        { kind: 'yes', text: 'Número medido só entra com fonte e data ao lado', check: 'revisão' },
        { kind: 'yes', text: 'Texto do corpo sempre acima de 4,5:1 de contraste', check: 'src/lib/design-tokens.test.ts' },
      ],
    },
    system: {
      label: '07 · Sistema',
      title: 'As peças, em tamanho de uso',
      text: 'O que as seções acima explicam, montado com os mesmos componentes que o resto do site usa — não uma ilustração deles.',
      typeTitle: 'Tipografia',
      specimens: [
        { meta: 'Space Grotesk 700 · 64 / 0,98', sample: 'Renderização e indexação', kind: 'display' },
        { meta: 'Space Grotesk 700 · 32 / 1,15', sample: 'Título de seção dentro do artigo', kind: 'section' },
        { meta: 'IBM Plex Sans 400 · 18 / 1,75 · 68ch', sample: 'O corpo do texto usa fundo grafite e texto quente‑neutro para reduzir o brilho em leitura longa. Os parágrafos são separados por espaço, nunca por recuo.', kind: 'body' },
        { meta: 'IBM Plex Mono · 11 / +14%', sample: 'Rótulo de instrumento', kind: 'mono' },
      ],
      componentsTitle: 'Componentes',
      buttons: ['Ler o experimento', 'Ver o código', 'Assinar o RSS'],
      noteLabel: 'Nota de laboratório',
      note: 'Blocos de destaque usam cantos de instrumento em vez da barra lateral colorida. A moldura é fina, o preenchimento é o mesmo da superfície e o rótulo carrega o acento.',
      gridTitle: 'Grade',
      gridLegend: ['1–3 · índice e metadados', '4–10 · corpo do texto', '11–12 · apoio e navegação'],
    },
    cta: { blog: 'Ir para o blog', blogHref: '/blog', code: 'Ver o sistema no GitHub' },
    footer: 'Colofão do design · última revisão',
  },
  en: {
    eyebrow: 'Why this site looks the way it does',
    heroWords: ['Retro', 'future', 'Swiss'],
    lead:
      'This page is the colophon of the site: it shows, with its own elements enlarged, where every visual decision on the blog comes from. On the other pages the style is restrained. Here it is shown at poster size.',
    schoolsLabel: 'Schools cited',
    schools: ['Bauhaus', 'De Stijl', 'International Typographic Style', 'Swiss school'],
    atmosphereLabel: 'Atmosphere reference',
    atmosphere: ['Remote-station science fiction', 'Instrument panels', 'The Lone Trail event, Arknights'],
    thesis: {
      label: '01 · Thesis',
      title: 'The retro-futurism I care about is not nostalgia. It is a way of reading.',
      paragraphs: [
        'The science-fiction interfaces that aged well are the ones designed as instruments: a fixed grid, short labels, large numbers, no decoration that does not inform. That is exactly what the Swiss school asked for thirty years earlier — and what a site about technical measurement needs to be.',
        'So the site has no chrome, no glow, no screen noise and no rocket typography. The future shows in how information is organized, not in texture. What remains retro is the vocabulary: corner marks, monospaced codes, hazard stripes, primary shapes.',
      ],
    },
    lineage: {
      label: '02 · Lineage',
      title: 'Four schools, four inheritances',
      where: 'Where it shows →',
      cards: [
        {
          school: 'Bauhaus',
          years: '1919 — 1933',
          title: 'Circle, square, triangle as a language',
          text: 'The primary shapes are not ornament: they are the alphabet of the categories. On the blog every topic axis gets one of them, always the same, at any size. No illustrative icon enters the system.',
          where: 'category markers, filter glyphs, tools, favicon',
        },
        {
          school: 'De Stijl',
          years: '1917 — 1931',
          title: 'Right angles only, and asymmetry on purpose',
          text: 'No rounded corner on any component of the site. Blocks balance by unequal weight, never by centering. The primaries come in muted, as state signals — red is regression, blue is reference.',
          where: 'sharp corners, card top stripes, state colors',
        },
        {
          school: 'International Typographic Style',
          years: '1950 →',
          title: 'The modular grid rules everything',
          text: 'Twelve columns, a 24px gutter. Text set flush left and ragged right, never justified. The measure stays between 62 and 72 characters, even when the screen has room to spare.',
          where: 'every layout, the article index, the footer',
        },
        {
          school: 'Swiss school',
          years: 'Zurich / Basel',
          title: 'Hierarchy by scale, never by ornament',
          text: 'The large section numbers come from here, along with the thin rules between blocks and the refusal to use color to create importance. If something needs emphasis, it grows — it does not turn colorful.',
          where: 'blog index, section titles, dividing rules',
        },
      ],
    },
    color: {
      label: '03 · Color',
      title: 'Dark as a reading decision, not a trend',
      text: 'The articles are long and full of code. A light background on a large screen, at night, tires the eye before the third block. The #0E1116 graphite holds long sessions and lets cyan and amber work as signal, not noise — they only appear in small areas or as text.',
      areaCaption: 'Area share by color',
      areaNote: 'design intent, not a measurement',
      tableTitle: 'Contrast measured, not assumed',
      tableCaption:
        'WCAG contrast ratio of each text color on the three surfaces, computed from the tokens on every build. The minimum for text is 4.5:1. The two failures are the reason the variants next to them exist.',
      headers: ['Token', 'Role', 'Page', 'Card', 'Code'],
      roles: {
        foreground: 'headings',
        body: 'long-form text',
        muted: 'support',
        label: 'mono label',
        labelOnCode: 'label on code',
        primary: 'accent, link',
        accent: 'alert, measuring',
        dangerText: 'regression (text)',
        danger: 'De Stijl red (shape)',
      },
      fails: 'fails',
    },
    atmosphereSection: {
      label: '04 · Atmosphere',
      title: ['The reference that set the tone: ', 'Lone Trail'],
      paragraphs: [
        'The starting point was the Lone Trail event in Arknights — not its artwork, which belongs to the people who made it, but its atmosphere: an isolated station, instrument panels reading numbers in the dark, industrial type and a cold cyan cut by alert amber. Silence, precision and the slight melancholy of a long mission.',
        'Only the functional vocabulary came across: short uppercase labels, identification codes, corner marks that frame important information and the habit of showing the state of everything. No graphic element was copied.',
      ],
      tags: ['Isolation', 'Instrumentation', 'Cold cyan · alert amber', 'Continuous logging'],
      morseLabel: 'Transmission · signing-off signal',
      morseAria: 'Signal in morse code: --. --- --- -.. -. .. --. .... -',
      eclipseAria:
        'Eclipse composition: a dark body with a cyan-lit rim, a second smaller body overlapping it and a four-pointed glint at the center.',
    },
    unit: {
      label: '05 · Unit',
      title: 'ST‑01, the bench unit',
      lead: 'Part of this site — text, code and this very drawing — is produced with AI assistance. Instead of hiding that in a footer, it became a character.',
      paragraphs: [
        'ST‑01 is built exclusively from the site’s alphabet: circle, square and triangle, in the same four colors of the system. There is not a single curve that is not an arc of a circle. It is literally the same set of parts that forms the category markers, reassembled at another scale.',
        'The cyan visor is the same accent line that runs through the site; the amber triangle on the antenna is the alert marker. It stands for the working agreement here: the machine executes and drafts; editorial decisions and measurement stay human.',
      ],
      roles: [
        { label: 'Executes', text: 'Drafts, refactors, data sweeps' },
        { label: 'Flags', text: 'Marks what a human has not verified yet' },
        { label: 'Does not decide', text: 'No published number comes from a machine estimate' },
      ],
      strip: ['Unit ST‑01 · bench', 'Parts: 3 shapes · 4 colors', 'Status: in service'],
      robotAria:
        'Robot ST-01 drawn only with circles, squares and triangles: a square head with a cyan visor, an amber triangular antenna and a chest panel with primary blocks.',
    },
    rules: {
      label: '06 · Rules',
      title: 'What the system forbids',
      no: 'No',
      yes: 'Yes',
      enforced: 'checked in CI',
      items: [
        { kind: 'no', text: 'A light background over a large area, on any screen', check: 'tests/seo/contrast.spec.ts' },
        { kind: 'no', text: 'Gradient, soft shadow or glow as decoration', check: 'src/design-rules.test.ts' },
        { kind: 'no', text: 'A rounded corner on any component', check: 'src/design-rules.test.ts' },
        { kind: 'no', text: 'Emoji, illustrative icon or mascot other than ST‑01', check: 'review' },
        { kind: 'yes', text: 'A measured number only with its source and date beside it', check: 'review' },
        { kind: 'yes', text: 'Body text always above 4.5:1 contrast', check: 'src/lib/design-tokens.test.ts' },
      ],
    },
    system: {
      label: '07 · System',
      title: 'The parts, at working size',
      text: 'What the sections above explain, assembled with the same components the rest of the site uses — not a picture of them.',
      typeTitle: 'Typography',
      specimens: [
        { meta: 'Space Grotesk 700 · 64 / 0.98', sample: 'Rendering and indexing', kind: 'display' },
        { meta: 'Space Grotesk 700 · 32 / 1.15', sample: 'A section title inside an article', kind: 'section' },
        { meta: 'IBM Plex Sans 400 · 18 / 1.75 · 68ch', sample: 'Body text sits on graphite in a warm neutral to cut glare during long reading. Paragraphs are separated by space, never by indentation.', kind: 'body' },
        { meta: 'IBM Plex Mono · 11 / +14%', sample: 'Instrument label', kind: 'mono' },
      ],
      componentsTitle: 'Components',
      buttons: ['Read the experiment', 'See the code', 'Subscribe via RSS'],
      noteLabel: 'Lab note',
      note: 'Callouts use instrument corners instead of a colored side bar. The frame is thin, the fill matches the surface and the label carries the accent.',
      gridTitle: 'Grid',
      gridLegend: ['1–3 · index and metadata', '4–10 · body text', '11–12 · support and navigation'],
    },
    cta: { blog: 'Read the technical SEO guide', blogHref: '/en/guide/technical-seo-nextjs', code: 'See the system on GitHub' },
    footer: 'Design colophon · last revised',
  },
}
