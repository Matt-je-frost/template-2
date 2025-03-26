/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF1493', // Hot pink
      },
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        bubblegum: ['"Bubblegum Sans"', 'cursive'],
      },
      textShadow: {
        'outline': '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-stroke': {
          '-webkit-text-stroke': '2px black',
        },
      };
      addUtilities(newUtilities);
    },
  ],
} 