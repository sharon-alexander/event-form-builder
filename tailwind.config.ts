import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf5f0",
          100: "#f0e4d6",
          200: "#e0c6a8",
          300: "#cda275",
          400: "#be844f",
          500: "#b07038",
          600: "#9a5a2e",
          700: "#7d4528",
          800: "#673a26",
          900: "#573222",
          950: "#311810",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
