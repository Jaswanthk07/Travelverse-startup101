/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0d1b2a",
          teal: "#0f766e",
          aqua: "#67e8f9",
          sun: "#f59e0b",
          mist: "#e0f2fe",
        },
      },
      boxShadow: {
        glow: "0 20px 60px rgba(13, 27, 42, 0.18)",
        soft: "0 10px 35px rgba(13, 27, 42, 0.12)",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(103, 232, 249, 0.34), transparent 32%), radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.24), transparent 28%), linear-gradient(135deg, rgba(13,27,42,0.98), rgba(15,118,110,0.92))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.92)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(1.08)", opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        fadeUp: "fadeUp 0.8s ease-out both",
        pulseRing: "pulseRing 2.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
