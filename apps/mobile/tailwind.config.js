/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#A43C12",
          light: "#FF7F50",
          dark: "#6C2000",
        },
        accent: "#4A6578",
        secondary: "#95445C",
        background: "#FAF9F7",
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#1A1C1B",
          muted: "#57423B",
        },
        border: "#DEC0B6",
        cream: "#F4F3F1",
      },
    },
  },
  plugins: [],
};
