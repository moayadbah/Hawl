import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens per design.md (Hawl Design System) — names kept from the
        // original Alinma palette, values updated to design.md's nearest
        // equivalent so every existing class (bg-alinma-navy, text-alinma-lavender…)
        // repaints without a class-name rewrite across the app.
        alinma: {
          navy: "#002134", // design.md primary-container — exact match, unchanged
          navy2: "#00060e", // design.md primary
          lavender: "#807cd5", // design.md on-tertiary-container
          lavender2: "#6d69b5", // muted lavender, derived for hover/darker states
          copper: "#845142", // design.md secondary
          copperLight: "#ffbca9", // design.md secondary-container
          copperDark: "#7b493a", // design.md on-secondary-container
          coral: "#f9b7a4", // design.md secondary-fixed-dim
          red: "#ba1a1a", // design.md error
          cream: "#f8f3f0", // design.md surface-container-low
          creamLight: "#ffffff", // design.md surface-container-lowest
          sand: "#fdf8f5", // design.md surface/background — exact match, unchanged
          ink: "#1c1b1a", // design.md on-surface
          gray: "#42474c", // design.md on-surface-variant
        },
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans Arabic",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        riyal: ["sarfont", "IBM Plex Sans Arabic", "sans-serif"],
      },
      fontSize: {
        // design.md type scale, opt-in on top of Tailwind's default scale
        "display-lg": ["40px", { lineHeight: "52px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-sm": ["13px", { lineHeight: "18px", fontWeight: "500", letterSpacing: "0.05em" }],
        "currency-display": ["36px", { lineHeight: "44px", fontWeight: "700" }],
      },
      borderRadius: {
        pill: "32px",
        card: "20px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0, 33, 52, 0.07)",
        card: "0 10px 30px rgba(0, 33, 52, 0.05)", // design.md's exact Card Level shadow
        lift: "0 20px 50px rgba(0, 33, 52, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "scale-in": "scale-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
