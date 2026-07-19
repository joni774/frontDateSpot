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
          DEFAULT: "#7C3048",
          light: "#A04D66",
          dark: "#5A2235",
        },
        accent: "#4A6578",
        secondary: "#3F4A56",
        background: "#F1F0EE",
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#1A1918",
          muted: "#6A6563",
        },
        border: "#E2DFDB",
        cream: "#EAE8E5",
      },
    },
  },
  plugins: [],
};
