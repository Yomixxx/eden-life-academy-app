import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'eden': '#5ec957',
        'eden-hover': '#4ec948',
        'bg-0': '#080f0e',
        'bg-1': '#0d1917',
        'bg-2': '#111f1d',
        'bg-3': '#162421',
      },
      fontFamily: {
        display: ['var(--font-montserrat)', 'sans-serif'],
        body: ['var(--font-poppins)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
