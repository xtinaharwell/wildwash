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
  theme: {
    extend: {
      colors: {
        red: maroon, // 👈 overrides red with maroon tones
      },
    },
  },
  plugins: [],
};
