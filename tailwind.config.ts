import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solar-energy palette: deep panel green + warm sunlight amber.
        ink: "#0C1A12",      // near-black green, primary text
        forest: "#0B3D2E",   // brand primary (panels, stability)
        forest2: "#10523E",  // lighter forest for hovers
        solar: "#F5A524",    // sunlight accent
        solarSoft: "#FCE9C4",
        surface: "#FAF8F3",  // warm off-white page
        panel: "#FFFFFF",
        line: "#E7E2D6",     // hairline borders
        muted: "#6E7B72",    // secondary text (warm grey-green)
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12,26,18,0.04), 0 8px 24px rgba(12,26,18,0.06)",
        lift: "0 12px 40px rgba(12,26,18,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
