import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta dark navy do dashboard Gestalize
        ink: {
          950: "#070b16", // fundo geral
          900: "#0b1020", // sidebar / topo
          850: "#0f1730", // card escuro
          800: "#131c38", // card / hover
          700: "#1c2747", // borda
        },
        brand: {
          DEFAULT: "#2563eb",
          400: "#3b82f6",
          500: "#2563eb",
          600: "#1d4ed8",
        },
        positive: "#22c55e",
        negative: "#ef4444",
        warning: "#f59e0b",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.1rem",
      },
    },
  },
  plugins: [],
};
export default config;
