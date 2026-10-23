import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests for /lib utilities (CLAUDE.md §8) and component tests for the
// three tool UIs (*.test.tsx, Testing Library). DOM globals (window,
// localStorage, document) come from the jsdom environment.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Só o que o Vitest tem como cobrir: lógica pura em /lib e a rota de API.
      // Os testes de componente (*.test.tsx) cobrem o contrato de interação das
      // ferramentas — rótulos, estados, evento — e ficam fora do piso de
      // propósito: medir componente aqui produziria um número que sobe sem que
      // a lógica testada mude. Páginas seguem com a suíte Playwright.
      include: ['src/lib/**', 'src/app/api/**'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      // Piso, não meta. Fica logo abaixo do medido em 2026-07-26
      // (88.3 stmts / 78.41 branches / 92.56 funcs / 93.12 lines), então uma
      // queda falha o CI e uma subida real pode ser fixada aqui depois. Não é
      // para perseguir 100: o objetivo é impedir regressão silenciosa, não
      // premiar teste de getter.
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
