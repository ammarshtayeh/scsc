import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0B3B78",
          accent: "#F2C318",
          background: "#FBFAF5",
          text: "#172033",
          sky: "#EEF4FF",
          muted: "#7A8089",
          slate: "#8B8D92",
          night: "#09111D",
          surface: "#101A2B",
          ink: "#EEF3FB",
          mist: "#A8B5CC"
        }
      },
      fontFamily: {
        heading: ["var(--font-heading-display)", "serif"],
        body: ["var(--font-body-display)", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 48px rgba(11, 59, 120, 0.10)",
        glow: "0 16px 42px rgba(242, 195, 24, 0.28)",
        elevated: "0 26px 70px rgba(11, 59, 120, 0.16)",
        card: "0 10px 30px rgba(23, 32, 51, 0.08)",
        float: "0 30px 90px rgba(11, 59, 120, 0.18)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(238,244,255,0.96), transparent 40%), radial-gradient(circle at 82% 18%, rgba(242,195,24,0.24), transparent 22%), radial-gradient(circle at bottom right, rgba(11,59,120,0.12), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.44), rgba(255,255,255,0.1))",
        "section-mesh":
          "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.56)), radial-gradient(circle at 20% 20%, rgba(242,195,24,0.14), transparent 20%), radial-gradient(circle at 80% 0%, rgba(11,59,120,0.14), transparent 28%)",
        "brand-radial":
          "radial-gradient(circle at top, rgba(242,195,24,0.26), transparent 24%), radial-gradient(circle at bottom right, rgba(11,59,120,0.2), transparent 32%)"
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        fadeIn: "fadeIn 0.5s ease-out",
        slideInUp: "slideInUp 0.6s ease-out",
        slideInDown: "slideInDown 0.6s ease-out",
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideInUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideInDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
