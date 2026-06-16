import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand blue from the marketing page (Tailwind blue scale)
        primary: colors.blue,
        // Indigo harmonizes with primary on the color wheel
        secondary: colors.indigo,
        // Lighter blue for highlights and tertiary actions
        accent: colors.sky,
        // Teal reads as positive/success while staying blue-adjacent
        success: colors.teal,
        // Amber complements blue for pending/queue states
        warning: colors.amber,
        // Rose red for destructive actions without clashing with blue
        danger: colors.rose,
        neutral: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
