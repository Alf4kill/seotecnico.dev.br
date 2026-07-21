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
    extend: {
      // Cores vêm dos tokens de globals.css, nunca de hex aqui: é o que faz o
      // tema escuro alcançar toda utility já escrita nos componentes. A forma
      // `rgb(var(--x) / <alpha-value>)` é obrigatória para que os modificadores
      // de opacidade (bg-primary/10, text-foreground/50) continuem funcionando.
      colors: {
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        // surface = cartões, header, modais; surface-2 = preenchimento sutil.
        // No claro surface é branco, então trocar bg-white por bg-surface não
        // muda nada visualmente — só passa a acompanhar o tema.
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          2: "rgb(var(--surface-2-rgb) / <alpha-value>)",
        },
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          dark: "rgb(var(--primary-dark-rgb) / <alpha-value>)",
          // Superfície de botão (texto branco por cima): não acompanha o tema.
          solid: "rgb(var(--primary-solid-rgb) / <alpha-value>)",
          "solid-hover": "rgb(var(--primary-solid-hover-rgb) / <alpha-value>)",
        },
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        gray: {
          DEFAULT: "rgb(var(--border-rgb) / <alpha-value>)",
        },
        // Mesmo valor de --color-accent (globals.css) — destaque/anotação.
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      spacing,
      zIndex,
      maxWidth: { ...spacing, ...namedSizes },
      minWidth: { ...spacing, ...namedSizes },
    },
  },
  plugins: [],
};
