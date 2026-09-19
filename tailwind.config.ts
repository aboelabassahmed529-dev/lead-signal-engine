import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (matches the Lead Signal Engine demo)
        ink: "#12281d",        // dark green (header, headings)
        forest: "#1c3d2b",     // deep green surfaces (CTA card)
        pine: "#2f6b4a",       // primary green
        sage: "#5c8a6f",       // mid green (bars, accents)
        mist: "#a9c9a0",       // light green
        lime: "#cfe3a3",       // accent button / logo bars
        cream: "#f5f2e7",      // page background
        card: "#ffffff",       // card background
        sand: "#eae5d4",       // subtle borders / tracks
        muted: "#6b7c6f",      // muted text
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
