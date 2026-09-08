import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f4",
          100: "#daf1e3",
          500: "#2f9e5e",
          600: "#25824c",
          700: "#1e6a3d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
