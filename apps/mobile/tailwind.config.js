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
          DEFAULT: "#B84A62",
          light: "#D47388",
          dark: "#8F3A4D",
        },
        accent: "#D4956A",
        secondary: "#5E4B63",
        background: "#FAF6F3",
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#2A2224",
          muted: "#7A6B6F",
        },
        border: "#EDE5E1",
        cream: "#F5EDE8",
      },
    },
  },
  plugins: [],
};
