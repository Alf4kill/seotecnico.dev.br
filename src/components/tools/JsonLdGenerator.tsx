'use client'

import { useState, type ReactNode } from 'react'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'
import { pushEvent } from '@/lib/analytics'
import {
  buildSchema,
  emptyGeneratorInput,
  toJsonLd,
  toNextComponent,
  validateInput,
  type GeneratorInput,
  type GeneratorSchemaType,
} from '@/lib/jsonld-generator'
import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// UI do Gerador de JSON-LD (/ferramentas/gerador-json-ld e
// /en/tools/json-ld-generator).
//
// Toda a lógica de schema vive em @/lib/jsonld-generator (pura, testada no
// Vitest); aqui é só estado de formulário e apresentação. Nada sai do
// navegador: o único efeito externo é o evento tool_generate_jsonld no
// dataLayer (documentado em docs/measurement-plan.md), sem dados do formulário.
// ─────────────────────────────────────────────────────────────────────────────

const COPY = {
  'pt-BR': {
    schemaOptions: [
      { value: 'Article', label: 'Artigo (Article)' },
      { value: 'FAQPage', label: 'FAQ (FAQPage)' },
      { value: 'BreadcrumbList', label: 'Breadcrumb (BreadcrumbList)' },
      { value: 'Person', label: 'Pessoa (Person)' },
      { value: 'Organization', label: 'Organização (Organization)' },
    ],
    schemaType: 'Tipo de schema',
    headline: 'Título do artigo (headline)',
    description: 'Descrição (meta description do artigo)',
    articleUrl: 'URL canônica do artigo',
    datePublished: 'Data de publicação',
    dateModified: 'Data de modificação',
    authorName: 'Nome do autor',
    authorUrl: 'URL do autor (perfil, sobre)',
    publisherName: 'Nome do site/publisher',
    imageUrl: 'URL da imagem de destaque',
    question: 'Pergunta',
    answer: 'Resposta (texto puro, sem HTML)',
    name: 'Nome',
    jobTitle: 'Cargo/título (jobTitle)',
    personUrl: 'URL (site pessoal ou página sobre)',
    personSameAs: 'Perfis (sameAs) — uma URL por linha',
    orgName: 'Nome da organização',
    orgUrl: 'URL do site',
    logoUrl: 'URL do logo',
    orgSameAs: 'Perfis oficiais (sameAs) — uma URL por linha',
    phHeadline: 'Como melhorar o LCP no Next.js',
    phDescription: 'Guia prático pelas 4 subpartes do LCP…',
    phArticleUrl: 'https://seusite.dev/blog/seu-artigo',
    phAuthorUrl: 'https://seusite.dev/sobre',
    phPublisher: 'Nome do seu site',
    phImage: 'https://seusite.dev/og/artigo.png',
    phQuestion: 'O que é um bom LCP?',
    phAnswer: '2,5 segundos ou menos no percentil 75…',
    phPersonUrl: 'https://seusite.dev',
    phOrgName: 'Nome da empresa',
    phOrgUrl: 'https://empresa.com.br',
    phLogo: 'https://empresa.com.br/logo.png',
    phYourName: 'Seu nome',
    phCrumbRoot: 'https://seusite.dev/',
    phCrumbBlog: 'https://seusite.dev/blog',
    phPersonSameAs: 'https://github.com/usuario\nhttps://linkedin.com/in/usuario',
    phOrgSameAs: 'https://linkedin.com/company/empresa\nhttps://instagram.com/empresa',
    level: 'Nível',
    removeQuestion: 'Remover pergunta',
    addQuestion: 'Adicionar pergunta',
    removeLevel: 'Remover nível',
    addLevel: 'Adicionar nível',
    generate: 'Gerar JSON-LD',
    outputFormat: 'Formato de saída',
    nextComponent: 'Componente Next.js',
    copied: 'Copiado',
    copyButton: 'Copiar',
    validateBefore: 'Antes de publicar, valide o resultado no',
    richResultsTest: 'teste de pesquisa aprimorada do Google',
  },
  en: {
    schemaOptions: [
      { value: 'Article', label: 'Article' },
      { value: 'FAQPage', label: 'FAQ (FAQPage)' },
      { value: 'BreadcrumbList', label: 'Breadcrumb (BreadcrumbList)' },
      { value: 'Person', label: 'Person' },
      { value: 'Organization', label: 'Organization' },
    ],
    schemaType: 'Schema type',
    headline: 'Article title (headline)',
    description: "Description (the article's meta description)",
    articleUrl: 'Canonical URL of the article',
    datePublished: 'Publication date',
    dateModified: 'Modification date',
    authorName: 'Author name',
    authorUrl: 'Author URL (profile, about page)',
    publisherName: 'Site/publisher name',
    imageUrl: 'Featured image URL',
    question: 'Question',
    answer: 'Answer (plain text, no HTML)',
    name: 'Name',
    jobTitle: 'Job title (jobTitle)',
    personUrl: 'URL (personal site or about page)',
    personSameAs: 'Profiles (sameAs) — one URL per line',
    orgName: 'Organization name',
    orgUrl: 'Site URL',
    logoUrl: 'Logo URL',
    orgSameAs: 'Official profiles (sameAs) — one URL per line',
    phHeadline: 'How to improve LCP in Next.js',
    phDescription: 'A practical guide through the 4 LCP subparts…',
    phArticleUrl: 'https://yoursite.dev/blog/your-article',
    phAuthorUrl: 'https://yoursite.dev/about',
    phPublisher: 'Your site name',
    phImage: 'https://yoursite.dev/og/article.png',
    phQuestion: 'What is a good LCP?',
    phAnswer: '2.5 seconds or less at the 75th percentile…',
    phPersonUrl: 'https://yoursite.dev',
    phOrgName: 'Company name',
    phOrgUrl: 'https://company.com',
    phLogo: 'https://company.com/logo.png',
    phYourName: 'Your name',
    phCrumbRoot: 'https://yoursite.dev/',
    phCrumbBlog: 'https://yoursite.dev/blog',
    phPersonSameAs: 'https://github.com/username\nhttps://linkedin.com/in/username',
    phOrgSameAs: 'https://linkedin.com/company/yourcompany\nhttps://instagram.com/yourcompany',
    level: 'Level',
    removeQuestion: 'Remove question',
    addQuestion: 'Add question',
    removeLevel: 'Remove level',
    addLevel: 'Add level',
    generate: 'Generate JSON-LD',
    outputFormat: 'Output format',
    nextComponent: 'Next.js component',
    copied: 'Copied',
    copyButton: 'Copy',
    validateBefore: "Before publishing, validate the result in Google's",
    richResultsTest: 'Rich Results Test',
  },
} as const

type OutputTab = 'json' | 'next'

const inputClass =
  // Borda --control (≥3:1, WCAG 1.4.11) e foco trocando a borda para o ciano.
  'w-full border border-gray-control bg-background px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-label focus:border-primary focus:outline-none'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span aria-hidden="true" className="text-primary"> *</span>}
      </span>
      {children}
    </label>
  )
}

export function JsonLdGenerator({ lang = 'pt-BR' }: { lang?: Lang }) {
  const copy = COPY[lang]
  const [schemaType, setSchemaType] = useState<GeneratorSchemaType>('Article')
  const [input, setInput] = useState<GeneratorInput>(emptyGeneratorInput)
  const [errors, setErrors] = useState<string[]>([])
  const [output, setOutput] = useState<{ json: string; next: string } | null>(null)
  const [tab, setTab] = useState<OutputTab>('json')
  const [copied, setCopied] = useState(false)

  const setArticle = (patch: Partial<GeneratorInput['article']>) =>
    setInput((s) => ({ ...s, article: { ...s.article, ...patch } }))
  const setPerson = (patch: Partial<GeneratorInput['person']>) =>
    setInput((s) => ({ ...s, person: { ...s.person, ...patch } }))
  const setOrganization = (patch: Partial<GeneratorInput['organization']>) =>
    setInput((s) => ({ ...s, organization: { ...s.organization, ...patch } }))

  function generate() {
    const found = validateInput(schemaType, input, lang)
    setErrors(found)
    if (found.length > 0) {
      setOutput(null)
      return
    }
    const schema = buildSchema(schemaType, input)
    setOutput({ json: toJsonLd(schema), next: toNextComponent(schemaType, schema, lang) })
    setCopied(false)
    // Evento-chave da ferramenta (measurement-plan.md) — só o tipo, nunca o conteúdo.
    pushEvent({ event: 'tool_generate_jsonld', schema_type: schemaType })
  }

  async function copyOutput() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(tab === 'json' ? output.json : output.next)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard indisponível (permissão/contexto): o usuário ainda pode
      // selecionar o texto manualmente.
    }
  }

  return (
    <div className="mt-10 border border-gray bg-surface p-5 md:p-8">
      <Field label={copy.schemaType} required>
        <select
          className={inputClass}
          value={schemaType}
          onChange={(e) => {
            setSchemaType(e.target.value as GeneratorSchemaType)
            setErrors([])
            setOutput(null)
          }}
        >
          {copy.schemaOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-6 grid gap-4">
        {schemaType === 'Article' && (
          <>
            <Field label={copy.headline} required>
              <input
                className={inputClass}
                value={input.article.headline}
                onChange={(e) => setArticle({ headline: e.target.value })}
                placeholder={copy.phHeadline}
              />
            </Field>
            <Field label={copy.description}>
              <input
                className={inputClass}
                value={input.article.description}
                onChange={(e) => setArticle({ description: e.target.value })}
                placeholder={copy.phDescription}
              />
            </Field>
            <Field label={copy.articleUrl} required>
              <input
                className={inputClass}
                type="url"
                value={input.article.url}
                onChange={(e) => setArticle({ url: e.target.value })}
                placeholder={copy.phArticleUrl}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.datePublished} required>
                <input
                  className={inputClass}
                  type="date"
                  value={input.article.datePublished}
                  onChange={(e) => setArticle({ datePublished: e.target.value })}
                />
              </Field>
              <Field label={copy.dateModified}>
                <input
                  className={inputClass}
                  type="date"
                  value={input.article.dateModified}
                  onChange={(e) => setArticle({ dateModified: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.authorName} required>
                <input
                  className={inputClass}
                  value={input.article.authorName}
                  onChange={(e) => setArticle({ authorName: e.target.value })}
                  placeholder={copy.phYourName}
                />
              </Field>
              <Field label={copy.authorUrl}>
                <input
                  className={inputClass}
                  type="url"
                  value={input.article.authorUrl}
                  onChange={(e) => setArticle({ authorUrl: e.target.value })}
                  placeholder={copy.phAuthorUrl}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.publisherName}>
                <input
                  className={inputClass}
                  value={input.article.publisherName}
                  onChange={(e) => setArticle({ publisherName: e.target.value })}
                  placeholder={copy.phPublisher}
                />
              </Field>
              <Field label={copy.imageUrl}>
                <input
                  className={inputClass}
                  type="url"
                  value={input.article.imageUrl}
                  onChange={(e) => setArticle({ imageUrl: e.target.value })}
                  placeholder={copy.phImage}
                />
              </Field>
            </div>
          </>
        )}

        {schemaType === 'FAQPage' && (
          <>
            {input.faq.map((pair, i) => (
              <fieldset key={i} className="border border-gray p-4">
                <legend className="eyebrow px-1">
                  {copy.question} {i + 1}
                </legend>
                <div className="grid gap-3">
                  <Field label={copy.question} required>
                    <input
                      className={inputClass}
                      value={pair.question}
                      onChange={(e) =>
                        setInput((s) => ({
                          ...s,
                          faq: s.faq.map((p, j) =>
                            j === i ? { ...p, question: e.target.value } : p
                          ),
                        }))
                      }
                      placeholder={copy.phQuestion}
                    />
                  </Field>
                  <Field label={copy.answer} required>
                    <textarea
                      className={`${inputClass} min-h-20`}
                      value={pair.answer}
                      onChange={(e) =>
                        setInput((s) => ({
                          ...s,
                          faq: s.faq.map((p, j) =>
                            j === i ? { ...p, answer: e.target.value } : p
                          ),
                        }))
                      }
                      placeholder={copy.phAnswer}
                    />
                  </Field>
                  {input.faq.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setInput((s) => ({ ...s, faq: s.faq.filter((_, j) => j !== i) }))
                      }
                      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> {copy.removeQuestion}
                    </button>
                  )}
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() =>
                setInput((s) => ({ ...s, faq: [...s.faq, { question: '', answer: '' }] }))
              }
              className="inline-flex w-fit items-center gap-1.5 px-3 py-2 border border-gray-control font-mono text-xs uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> {copy.addQuestion}
            </button>
          </>
        )}

        {schemaType === 'BreadcrumbList' && (
          <>
            {input.breadcrumb.map((item, i) => (
              <fieldset key={i} className="border border-gray p-4">
                <legend className="eyebrow px-1">
                  {copy.level} {i + 1}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={copy.name} required>
                    <input
                      className={inputClass}
                      value={item.name}
                      onChange={(e) =>
                        setInput((s) => ({
                          ...s,
                          breadcrumb: s.breadcrumb.map((b, j) =>
                            j === i ? { ...b, name: e.target.value } : b
                          ),
                        }))
                      }
                      placeholder={i === 0 ? 'Home' : 'Blog'}
                    />
                  </Field>
                  <Field label="URL" required>
                    <input
                      className={inputClass}
                      type="url"
                      value={item.url}
                      onChange={(e) =>
                        setInput((s) => ({
                          ...s,
                          breadcrumb: s.breadcrumb.map((b, j) =>
                            j === i ? { ...b, url: e.target.value } : b
                          ),
                        }))
                      }
                      placeholder={i === 0 ? copy.phCrumbRoot : copy.phCrumbBlog}
                    />
                  </Field>
                </div>
                {input.breadcrumb.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setInput((s) => ({
                        ...s,
                        breadcrumb: s.breadcrumb.filter((_, j) => j !== i),
                      }))
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> {copy.removeLevel}
                  </button>
                )}
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() =>
                setInput((s) => ({ ...s, breadcrumb: [...s.breadcrumb, { name: '', url: '' }] }))
              }
              className="inline-flex w-fit items-center gap-1.5 px-3 py-2 border border-gray-control font-mono text-xs uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> {copy.addLevel}
            </button>
          </>
        )}

        {schemaType === 'Person' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.name} required>
                <input
                  className={inputClass}
                  value={input.person.name}
                  onChange={(e) => setPerson({ name: e.target.value })}
                  placeholder={copy.phYourName}
                />
              </Field>
              <Field label={copy.jobTitle}>
                <input
                  className={inputClass}
                  value={input.person.jobTitle}
                  onChange={(e) => setPerson({ jobTitle: e.target.value })}
                  placeholder="Technical SEO Specialist"
                />
              </Field>
            </div>
            <Field label={copy.personUrl}>
              <input
                className={inputClass}
                type="url"
                value={input.person.url}
                onChange={(e) => setPerson({ url: e.target.value })}
                placeholder={copy.phPersonUrl}
              />
            </Field>
            <Field label={copy.personSameAs}>
              <textarea
                className={`${inputClass} min-h-20`}
                value={input.person.sameAs}
                onChange={(e) => setPerson({ sameAs: e.target.value })}
                placeholder={copy.phPersonSameAs}
              />
            </Field>
          </>
        )}

        {schemaType === 'Organization' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.orgName} required>
                <input
                  className={inputClass}
                  value={input.organization.name}
                  onChange={(e) => setOrganization({ name: e.target.value })}
                  placeholder={copy.phOrgName}
                />
              </Field>
              <Field label={copy.orgUrl} required>
                <input
                  className={inputClass}
                  type="url"
                  value={input.organization.url}
                  onChange={(e) => setOrganization({ url: e.target.value })}
                  placeholder={copy.phOrgUrl}
                />
              </Field>
            </div>
            <Field label={copy.logoUrl}>
              <input
                className={inputClass}
                type="url"
                value={input.organization.logoUrl}
                onChange={(e) => setOrganization({ logoUrl: e.target.value })}
                placeholder={copy.phLogo}
              />
            </Field>
            <Field label={copy.orgSameAs}>
              <textarea
                className={`${inputClass} min-h-20`}
                value={input.organization.sameAs}
                onChange={(e) => setOrganization({ sameAs: e.target.value })}
                placeholder={copy.phOrgSameAs}
              />
            </Field>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="mt-6 list-disc border border-accent/60 bg-accent/10 py-3 pl-8 pr-4 text-sm text-foreground"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={generate}
        className="mt-6 min-h-12 bg-primary-solid px-6 font-mono text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-solid-hover"
      >
        {copy.generate}
      </button>

      {output && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label={copy.outputFormat} className="flex gap-2">
              {(
                [
                  ['json', 'JSON-LD'],
                  ['next', copy.nextComponent],
                ] as [OutputTab, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => {
                    setTab(value)
                    setCopied(false)
                  }}
                  className={[
                    'px-4 py-2 font-mono text-xs uppercase tracking-[0.08em] transition-colors',
                    tab === value
                      ? 'border border-primary bg-primary text-on-primary'
                      : 'border border-gray-control text-foreground hover:border-primary',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copyOutput}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-control font-mono text-xs uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" /> {copy.copied}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" /> {copy.copyButton}
                </>
              )}
            </button>
          </div>
          <pre className="theme-dark-island mt-4 overflow-x-auto border border-gray bg-surface-2 p-4 font-mono text-sm leading-6 text-body">
            <code>{tab === 'json' ? output.json : output.next}</code>
          </pre>
          <p className="mt-3 text-sm text-muted">
            {copy.validateBefore}{' '}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-[3px]"
            >
              {copy.richResultsTest}
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}
