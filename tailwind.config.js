/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EC4899",
          light: "#FDF2F8",
          dark: "#DB2777",
        },
        secondary: {
          DEFAULT: "#F97316",
          light: "#FFF7ED",
        },
        background: "#FDF2F8",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};