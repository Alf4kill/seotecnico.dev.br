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

// ─────────────────────────────────────────────────────────────────────────────
// UI do Gerador de JSON-LD (/ferramentas/gerador-json-ld).
//
// Toda a lógica de schema vive em @/lib/jsonld-generator (pura, testada no
// Vitest); aqui é só estado de formulário e apresentação. Nada sai do
// navegador: o único efeito externo é o evento tool_generate_jsonld no
// dataLayer (documentado em docs/measurement-plan.md), sem dados do formulário.
// ─────────────────────────────────────────────────────────────────────────────

const schemaOptions: { value: GeneratorSchemaType; label: string }[] = [
  { value: 'Article', label: 'Artigo (Article)' },
  { value: 'FAQPage', label: 'FAQ (FAQPage)' },
  { value: 'BreadcrumbList', label: 'Breadcrumb (BreadcrumbList)' },
  { value: 'Person', label: 'Pessoa (Person)' },
  { value: 'Organization', label: 'Organização (Organization)' },
]

type OutputTab = 'json' | 'next'

const inputClass =
  'w-full rounded-lg border border-gray bg-surface px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted/60 focus:border-primary focus:outline-none'

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

export function JsonLdGenerator() {
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
    const found = validateInput(schemaType, input)
    setErrors(found)
    if (found.length > 0) {
      setOutput(null)
      return
    }
    const schema = buildSchema(schemaType, input)
    setOutput({ json: toJsonLd(schema), next: toNextComponent(schemaType, schema) })
    setCopied(false)
    // Evento-chave da ferramenta (measurement-plan.md) — só o tipo, nunca o conteúdo.
    pushEvent({ event: 'tool_generate_jsonld', schema_type: schemaType })
  }

  async function copy() {
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
    <div className="mt-10 rounded-2xl border border-gray bg-surface p-5 md:p-8">
      <Field label="Tipo de schema" required>
        <select
          className={inputClass}
          value={schemaType}
          onChange={(e) => {
            setSchemaType(e.target.value as GeneratorSchemaType)
            setErrors([])
            setOutput(null)
          }}
        >
          {schemaOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-6 grid gap-4">
        {schemaType === 'Article' && (
          <>
            <Field label="Título do artigo (headline)" required>
              <input
                className={inputClass}
                value={input.article.headline}
                onChange={(e) => setArticle({ headline: e.target.value })}
                placeholder="Como melhorar o LCP no Next.js"
              />
            </Field>
            <Field label="Descrição (meta description do artigo)">
              <input
                className={inputClass}
                value={input.article.description}
                onChange={(e) => setArticle({ description: e.target.value })}
                placeholder="Guia prático pelas 4 subpartes do LCP…"
              />
            </Field>
            <Field label="URL canônica do artigo" required>
              <input
                className={inputClass}
                type="url"
                value={input.article.url}
                onChange={(e) => setArticle({ url: e.target.value })}
                placeholder="https://seusite.dev/blog/seu-artigo"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de publicação" required>
                <input
                  className={inputClass}
                  type="date"
                  value={input.article.datePublished}
                  onChange={(e) => setArticle({ datePublished: e.target.value })}
                />
              </Field>
              <Field label="Data de modificação">
                <input
                  className={inputClass}
                  type="date"
                  value={input.article.dateModified}
                  onChange={(e) => setArticle({ dateModified: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do autor" required>
                <input
                  className={inputClass}
                  value={input.article.authorName}
                  onChange={(e) => setArticle({ authorName: e.target.value })}
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="URL do autor (perfil, sobre)">
                <input
                  className={inputClass}
                  type="url"
                  value={input.article.authorUrl}
                  onChange={(e) => setArticle({ authorUrl: e.target.value })}
                  placeholder="https://seusite.dev/sobre"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do site/publisher">
                <input
                  className={inputClass}
                  value={input.article.publisherName}
                  onChange={(e) => setArticle({ publisherName: e.target.value })}
                  placeholder="Nome do seu site"
                />
              </Field>
              <Field label="URL da imagem de destaque">
                <input
                  className={inputClass}
                  type="url"
                  value={input.article.imageUrl}
                  onChange={(e) => setArticle({ imageUrl: e.target.value })}
                  placeholder="https://seusite.dev/og/artigo.png"
                />
              </Field>
            </div>
          </>
        )}

        {schemaType === 'FAQPage' && (
          <>
            {input.faq.map((pair, i) => (
              <fieldset key={i} className="rounded-xl border border-gray p-4">
                <legend className="px-1 text-sm font-medium text-muted">
                  Pergunta {i + 1}
                </legend>
                <div className="grid gap-3">
                  <Field label="Pergunta" required>
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
                      placeholder="O que é um bom LCP?"
                    />
                  </Field>
                  <Field label="Resposta (texto puro, sem HTML)" required>
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
                      placeholder="2,5 segundos ou menos no percentil 75…"
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
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Remover pergunta
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
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray px-3 py-2 text-sm font-medium text-foreground hover:border-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar pergunta
            </button>
          </>
        )}

        {schemaType === 'BreadcrumbList' && (
          <>
            {input.breadcrumb.map((item, i) => (
              <fieldset key={i} className="rounded-xl border border-gray p-4">
                <legend className="px-1 text-sm font-medium text-muted">
                  Nível {i + 1}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome" required>
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
                      placeholder={i === 0 ? 'https://seusite.dev/' : 'https://seusite.dev/blog'}
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
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Remover nível
                  </button>
                )}
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() =>
                setInput((s) => ({ ...s, breadcrumb: [...s.breadcrumb, { name: '', url: '' }] }))
              }
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray px-3 py-2 text-sm font-medium text-foreground hover:border-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar nível
            </button>
          </>
        )}

        {schemaType === 'Person' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" required>
                <input
                  className={inputClass}
                  value={input.person.name}
                  onChange={(e) => setPerson({ name: e.target.value })}
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="Cargo/título (jobTitle)">
                <input
                  className={inputClass}
                  value={input.person.jobTitle}
                  onChange={(e) => setPerson({ jobTitle: e.target.value })}
                  placeholder="Technical SEO Specialist"
                />
              </Field>
            </div>
            <Field label="URL (site pessoal ou página sobre)">
              <input
                className={inputClass}
                type="url"
                value={input.person.url}
                onChange={(e) => setPerson({ url: e.target.value })}
                placeholder="https://seusite.dev"
              />
            </Field>
            <Field label="Perfis (sameAs) — uma URL por linha">
              <textarea
                className={`${inputClass} min-h-20`}
                value={input.person.sameAs}
                onChange={(e) => setPerson({ sameAs: e.target.value })}
                placeholder={'https://github.com/usuario\nhttps://linkedin.com/in/usuario'}
              />
            </Field>
          </>
        )}

        {schemaType === 'Organization' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da organização" required>
                <input
                  className={inputClass}
                  value={input.organization.name}
                  onChange={(e) => setOrganization({ name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </Field>
              <Field label="URL do site" required>
                <input
                  className={inputClass}
                  type="url"
                  value={input.organization.url}
                  onChange={(e) => setOrganization({ url: e.target.value })}
                  placeholder="https://empresa.com.br"
                />
              </Field>
            </div>
            <Field label="URL do logo">
              <input
                className={inputClass}
                type="url"
                value={input.organization.logoUrl}
                onChange={(e) => setOrganization({ logoUrl: e.target.value })}
                placeholder="https://empresa.com.br/logo.png"
              />
            </Field>
            <Field label="Perfis oficiais (sameAs) — uma URL por linha">
              <textarea
                className={`${inputClass} min-h-20`}
                value={input.organization.sameAs}
                onChange={(e) => setOrganization({ sameAs: e.target.value })}
                placeholder={'https://linkedin.com/company/empresa\nhttps://instagram.com/empresa'}
              />
            </Field>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="mt-6 list-disc rounded-xl border border-accent/40 bg-accent/10 py-3 pl-8 pr-4 text-sm text-foreground"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={generate}
        className="mt-6 rounded-lg bg-primary-solid px-6 py-2.5 font-semibold text-white hover:bg-primary/90"
      >
        Gerar JSON-LD
      </button>

      {output && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Formato de saída" className="flex gap-2">
              {(
                [
                  ['json', 'JSON-LD'],
                  ['next', 'Componente Next.js'],
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
                    'rounded-lg px-4 py-2 text-sm font-medium',
                    tab === value
                      ? 'bg-primary-solid text-white'
                      : 'border border-gray text-foreground hover:border-primary',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray px-4 py-2 text-sm font-medium text-foreground hover:border-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
                </>
              )}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--code-background)] p-4 text-sm leading-6 text-[#c9d1d9]">
            <code>{tab === 'json' ? output.json : output.next}</code>
          </pre>
          <p className="mt-3 text-sm text-muted">
            Antes de publicar, valide o resultado no{' '}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              teste de pesquisa aprimorada do Google
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}
