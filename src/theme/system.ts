import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        navy: {
          950: { value: "#050915" },
          900: { value: "#07111f" },
          800: { value: "#0d1a2d" },
        },
        graphite: {
          900: { value: "#121419" },
          800: { value: "#1c2028" },
          700: { value: "#2a2f3a" },
        },
        accent: {
          purple: { value: "#8f5cff" },
          blue: { value: "#38bdf8" },
          silver: { value: "#c7ceda" },
          oak: { value: "#b89567" },
        },
      },
      fonts: {
        heading: { value: "var(--font-geist-sans)" },
        body: { value: "var(--font-geist-sans)" },
      },
      radii: {
        card: { value: "8px" },
        control: { value: "999px" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
