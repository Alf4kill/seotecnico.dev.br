// ─────────────────────────────────────────────────────────────────────────────
// RUM próprio — Core Web Vitals medidos em visitas reais (build de attribution
// do `web-vitals`), reportados como evento `web_vitals` via o helper tipado.
//
// Sink: GA4 via GTM (evento documentado em docs/measurement-plan.md). O push
// no dataLayer acontece sempre; o disparo da tag e o uso de cookies são
// controlados pelo Consent Mode v2, como todo o resto do pipeline.
//
// LCP + INP — o site está abaixo do threshold do CrUX, então este é o único
// dado de campo que existe. CLS entra depois sob o mesmo nome de evento.
// ─────────────────────────────────────────────────────────────────────────────

import {
  onINP,
  onLCP,
  type INPMetricWithAttribution,
  type LCPMetricWithAttribution,
} from 'web-vitals/attribution'
import { pushEvent } from './analytics'

// GA4 trunca valores de parâmetro em 100 caracteres — corta aqui para o
// seletor não chegar mutilado de forma imprevisível.
const MAX_SELECTOR_LENGTH = 100

export function reportLCP(metric: LCPMetricWithAttribution): void {
  const { attribution } = metric
  pushEvent({
    event: 'web_vitals',
    metric_name: 'LCP',
    metric_id: metric.id,
    metric_value: Math.round(metric.value),
    metric_rating: metric.rating,
    lcp_element: (attribution.target ?? '(unknown)').slice(0, MAX_SELECTOR_LENGTH),
    lcp_ttfb: Math.round(attribution.timeToFirstByte),
    lcp_load_delay: Math.round(attribution.resourceLoadDelay),
    lcp_load_duration: Math.round(attribution.resourceLoadDuration),
    lcp_render_delay: Math.round(attribution.elementRenderDelay),
  })
}

export function reportINP(metric: INPMetricWithAttribution): void {
  const { attribution } = metric
  pushEvent({
    event: 'web_vitals',
    metric_name: 'INP',
    metric_id: metric.id,
    metric_value: Math.round(metric.value),
    metric_rating: metric.rating,
    // interactionTarget vazio = elemento removido do DOM após a interação
    inp_element: (attribution.interactionTarget || '(unknown)').slice(0, MAX_SELECTOR_LENGTH),
    inp_interaction_type: attribution.interactionType,
    inp_load_state: attribution.loadState,
    inp_input_delay: Math.round(attribution.inputDelay),
    inp_processing_duration: Math.round(attribution.processingDuration),
    inp_presentation_delay: Math.round(attribution.presentationDelay),
  })
}

let started = false

/**
 * Registra os observers de Web Vitals uma única vez por page load real.
 * As métricas valem para o page load inteiro (não por soft navigation), então
 * chamadas repetidas — re-mounts, StrictMode — não devem re-registrar.
 * O INP pode reportar mais de uma vez (valor pior após a página voltar de
 * hidden), sempre com o mesmo metric_id — a análise no GA4 usa o máximo por id.
 */
export function initRum(): void {
  if (started || typeof window === 'undefined') return
  started = true
  onLCP(reportLCP)
  onINP(reportINP)
}
