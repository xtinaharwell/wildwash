const maroon = {
  50: '#fdf5f5',
  100: '#f9e0e0',
  200: '#f0bdbd',
  300: '#e49393',
  400: '#d16666',
  500: '#800000', // main maroon tone
  600: '#660000',
  700: '#4d0000',
  800: '#330000',
  900: '#1a0000',
};

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        red: maroon, // 👈 overrides red with maroon tones
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
