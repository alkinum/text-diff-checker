import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "diff-added": {
          bg: "hsl(var(--diff-added-bg))",
          text: "hsl(var(--diff-added-text))",
        },
        "diff-removed": {
          bg: "hsl(var(--diff-removed-bg))",
          text: "hsl(var(--diff-removed-text))",
        },
        "diff-changed": {
          bg: "hsl(var(--diff-changed-bg))",
          text: "hsl(var(--diff-changed-text))",
        },
        "diff-extra": {
          bg: "hsl(var(--diff-extra-bg))",
          text: "hsl(var(--diff-extra-text))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
      },
      backgroundColor: {
        "diff-deleted-bg": "hsl(var(--diff-removed-bg))",
        "diff-added-bg": "hsl(var(--diff-added-bg))",
        "diff-changed-bg": "hsl(var(--diff-changed-bg))",
        "diff-extra-bg": "hsl(var(--diff-extra-bg))",
      },
      textColor: {
        "diff-deleted-text": "hsl(var(--diff-removed-text))",
        "diff-added-text": "hsl(var(--diff-added-text))",
        "diff-changed-text": "hsl(var(--diff-changed-text))",
        "diff-extra-text": "hsl(var(--diff-extra-text))",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};

export default config;
