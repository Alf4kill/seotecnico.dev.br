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
      colors: {
        background: "#ffffff",
        foreground: "#111827",
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
        },
        muted: "#6B7280",
        gray: {
          DEFAULT: "#E5E7EB",
        },
        // Mesmo valor de --color-accent (globals.css) — destaque/anotação.
        accent: {
          DEFAULT: "#F59E0B",
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
