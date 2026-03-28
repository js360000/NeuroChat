/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lexend', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
      },
      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px hsl(var(--glow) / 0.1)",
        "glow-md": "0 0 30px hsl(var(--glow) / 0.15)",
        "glow-lg": "0 0 50px hsl(var(--glow) / 0.2)",
        "glow-primary": "0 0 20px hsl(var(--primary) / 0.3)",
        "glow-accent": "0 0 20px hsl(var(--accent) / 0.3)",
        "card": "0 4px 24px hsl(var(--background) / 0.3)",
        "card-hover": "0 8px 40px hsl(var(--primary) / 0.1)",
        "inner-glow": "inset 0 1px 0 hsl(var(--primary) / 0.1)",
      },
      animation: {
        "message-pop": "message-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "float": "float 4s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "typing-1": "typing-bounce 1s ease-in-out infinite",
        "typing-2": "typing-bounce 1s ease-in-out 0.15s infinite",
        "typing-3": "typing-bounce 1s ease-in-out 0.3s infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "mood-pulse": "mood-pulse 3s ease-in-out infinite",
        "neural-flow": "neural-flow 8s ease infinite",
        "breathe": "breathe 3s ease-in-out infinite",
        "ripple": "ripple 0.6s linear",
        "status-pulse": "status-pulse 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-neural": "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--secondary) / 0.03), hsl(var(--accent) / 0.02))",
        "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
        "gradient-card": "linear-gradient(135deg, hsl(var(--card)), hsl(var(--surface)))",
        "shimmer": "linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground) / 0.05) 50%, transparent 100%)",
      },
      backgroundSize: {
        "shimmer": "200% 100%",
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "sidebar": "320px",
      },
    },
  },
  plugins: [],
}
