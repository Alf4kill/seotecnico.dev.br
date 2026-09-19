/** @type {import('tailwindcss').Config} */

// Replicate Tailwind v4's dynamic spacing scale (0.25rem per step, incl. .5
// increments) so utilities like pt-30, h-13, px-15, top-30, h-4.5 keep working.
const spacing = {};
for (let i = 0; i <= 200; i += 0.5) spacing[i] = `${i * 0.25}rem`;

// Replicate v4's dynamic z-index (e.g. z-9) while keeping named steps.
const zIndex = {};
for (let i = 0; i <= 100; i++) zIndex[i] = `${i}`;

// v4 resolves max-width/min-width numeric values from the spacing scale and
// adds the container-size names (2xs/3xs). v3 does neither, so replicate both.
const namedSizes = { "2xs": "18rem", "3xs": "16rem" };

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    // Substituídos, não estendidos: o sistema não tem canto arredondado nem
    // sombra (docs/design-system.md, regras "NÃO"). `rounded-full` fica porque
    // o círculo é uma das três formas primárias; `rounded-lg`, `shadow-md` e
    // afins deixam de existir — e src/design-rules.test.ts falha se alguém os
    // escrever, em vez de gerar uma classe que silenciosamente não faz nada.
    borderRadius: {
      none: "0",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
    },
    extend: {
      // Cores vêm dos tokens de globals.css, nunca de hex aqui. A forma
      // `rgb(var(--x) / <alpha-value>)` é obrigatória para que os modificadores
      // de opacidade (bg-primary/10, text-foreground/50) continuem funcionando.
      colors: {
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        // surface = cartões; surface-2 = elevada/código; surface-alt = faixa.
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          2: "rgb(var(--surface-2-rgb) / <alpha-value>)",
          alt: "rgb(var(--surface-alt-rgb) / <alpha-value>)",
        },
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        // Texto: body = leitura longa; muted = apoio; label = rótulo mono.
        body: "rgb(var(--body-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        label: {
          DEFAULT: "rgb(var(--label-rgb) / <alpha-value>)",
          code: "rgb(var(--label-code-rgb) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          hover: "rgb(var(--primary-hover-rgb) / <alpha-value>)",
          // Superfície de botão. O texto por cima é `text-on-primary`.
          solid: "rgb(var(--primary-solid-rgb) / <alpha-value>)",
          "solid-hover": "rgb(var(--primary-solid-hover-rgb) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--on-primary-rgb) / <alpha-value>)",
        // Fios: gray = 1px decorativo (border-gray); strong = contorno de
        // botão; control = borda de campo de formulário (≥3:1).
        gray: {
          DEFAULT: "rgb(var(--border-rgb) / <alpha-value>)",
          strong: "rgb(var(--border-strong-rgb) / <alpha-value>)",
          control: "rgb(var(--control-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
        },
        // Formas De Stijl — nunca como cor de texto (ver globals.css).
        shape: {
          danger: "rgb(var(--danger-shape-rgb) / <alpha-value>)",
          reference: "rgb(var(--reference-rgb) / <alpha-value>)",
        },
        // Estados semânticos. danger é o vermelho clareado, seguro como texto.
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      spacing,
      zIndex,
      maxWidth: { ...spacing, ...namedSizes },
      minWidth: { ...spacing, ...namedSizes },
    },
  },
  plugins: [],
};
