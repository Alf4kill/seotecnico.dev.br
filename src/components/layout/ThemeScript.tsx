import { chrome } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Aplica o tema ANTES da primeira pintura (docs/design-system.md → temas).
//
// Ordem: escolha salva pelo botão (localStorage) → preferência do sistema. O
// resultado vai para <html data-theme>, que é o único seletor do tema claro em
// globals.css. Sem JavaScript o atributo não existe e vale a base escura.
//
// Precisa ser um <script> síncrono no <head>: qualquer coisa que rode depois
// (efeito, script adiado) pinta o tema errado e corrige — exatamente o clarão
// que o site não pode ter. São ~500 bytes, sem requisição.
//
// Também troca o <meta name="theme-color"> (barra do navegador mobile), para
// ele acompanhar a escolha explícita e não só a preferência do sistema.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_STORAGE_KEY = 'seotecnico:theme'

/** Evento que o botão e o script disparam quando o tema efetivo muda. */
export const THEME_EVENT = 'seotecnico:themechange'

const script = `(function(){
var d=document.documentElement,k=${JSON.stringify(THEME_STORAGE_KEY)},m=window.matchMedia('(prefers-color-scheme: light)'),c=${JSON.stringify(chrome)};
function saved(){try{var v=localStorage.getItem(k);return v==='light'||v==='dark'?v:null}catch(e){return null}}
function apply(){var t=saved()||(m.matches?'light':'dark');d.dataset.theme=t;var n=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<n.length;i++){n[i].setAttribute('content',c[t]);n[i].removeAttribute('media')}}
apply();
if(m.addEventListener)m.addEventListener('change',function(){if(!saved()){apply();window.dispatchEvent(new Event(${JSON.stringify(THEME_EVENT)}))}});
document.addEventListener('DOMContentLoaded',apply);
})();`

export function ThemeScript() {
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: script }} />
}
