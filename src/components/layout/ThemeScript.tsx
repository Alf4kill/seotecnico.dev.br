// ─────────────────────────────────────────────────────────────────────────────
// Aplica o tema escolhido ANTES da primeira pintura.
//
// Precisa ser um script inline e síncrono no <head>: qualquer coisa que rode
// depois (useEffect, script diferido) pinta o tema errado primeiro e corrige
// em seguida — o flash branco que o tema escuro existe para evitar.
//
// Sem escolha salva, nada é escrito: o CSS já segue prefers-color-scheme, que
// é o padrão exigido pela §9. O atributo só aparece quando o usuário escolheu.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_STORAGE_KEY = 'seotecnico:theme'

// Minificado à mão porque vai inline no HTML de toda página: o try/catch cobre
// navegadores com storage bloqueado (modo privado, cookies de terceiros).
const script = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
