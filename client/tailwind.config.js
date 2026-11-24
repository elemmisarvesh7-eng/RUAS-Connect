export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        base: '#f5f3ee', surface: '#ffffff', ink: '#1c1a15',
        accent: '#5b4bdb', 'accent-soft': '#ece9fb', muted: '#8a8578', border: '#e6e2d9',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,26,21,0.04), 0 8px 24px rgba(28,26,21,0.06)',
        lifted: '0 4px 12px rgba(28,26,21,0.06), 0 24px 48px rgba(28,26,21,0.08)',
      },
      keyframes: { 'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { 'fade-up': 'fade-up 0.5s ease-out forwards' },
    },
  },
  plugins: [],
}