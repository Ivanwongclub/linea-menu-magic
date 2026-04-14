import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Noto Sans TC', 'sans-serif'],
        chinese: ['Noto Sans TC', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
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
        nav: {
          DEFAULT: "hsl(var(--nav-background))",
          foreground: "hsl(var(--nav-foreground))",
          hover: "hsl(var(--nav-hover))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        'surface-secondary': 'hsl(0 0% 96%)',
        'inverse': 'hsl(0 0% 4%)',
        'inverse-foreground': 'hsl(0 0% 96%)',
        heritage: "hsl(var(--color-heritage-bg))",
      },
      fontSize: {
        "micro":   ["8px",  { lineHeight: "1.2" }],
        "tiny":    ["9px",  { lineHeight: "1.3" }],
        "caption": ["10px", { lineHeight: "1.4" }],
        "label":   ["11px", { lineHeight: "1.4" }],
        "body-sm": ["13px", { lineHeight: "1.6" }],
        "body-md": ["14px", { lineHeight: "1.6" }],
        "nav":     ["15px", { lineHeight: "1.4" }],
      },
      letterSpacing: {
        "tighter-2": "0.04em",
        "display":   "0.06em",
        "nav":       "0.08em",
        "label":     "0.12em",
        "wide":      "0.15em",
        "wider-2":   "0.2em",
        "widest-2":  "0.35em",
      },
      boxShadow: {
        "mega": "0 8px 24px rgba(0,0,0,0.06)",
        "card": "0 8px 32px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        "out-expo":    "cubic-bezier(0.19, 1, 0.22, 1)",
        "out-quart":   "cubic-bezier(0.25, 1, 0.5, 1)",
        "spring":      "cubic-bezier(0.34, 1.4, 0.64, 1)",
        "in-out-soft": "cubic-bezier(0.45, 0, 0.15, 1)",
      },
      transitionDuration: {
        "420": "420ms",
        "680": "680ms",
        "900": "900ms",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "reveal-left": {
          from: { opacity: "0", transform: "translateX(-32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "reveal-right": {
          from: { opacity: "0", transform: "translateX(32px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "reveal-scale": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-down": "slide-down 0.25s ease-out",
        "reveal-up":    "reveal-up    680ms cubic-bezier(0.19,1,0.22,1) both",
        "reveal-left":  "reveal-left  680ms cubic-bezier(0.19,1,0.22,1) both",
        "reveal-right": "reveal-right 680ms cubic-bezier(0.19,1,0.22,1) both",
        "reveal-scale": "reveal-scale 680ms cubic-bezier(0.25,1,0.5,1)  both",
        "page-enter":   "page-enter   900ms cubic-bezier(0.19,1,0.22,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
