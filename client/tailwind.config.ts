import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F7F5',
        surface: '#FFFFFF',
        border: '#E4E4E1',
        ink: '#1A1D1F',
        muted: '#6B7075',
        brand: {
          DEFAULT: '#1E4B4B',
          hover: '#163838',
          light: '#E7EFEE',
        },
        status: {
          applied: { fg: '#B45309', bg: '#FEF3C7' },
          sanctioned: { fg: '#1D4ED8', bg: '#DBEAFE' },
          rejected: { fg: '#B91C1C', bg: '#FEE2E2' },
          disbursed: { fg: '#15803D', bg: '#DCFCE7' },
          closed: { fg: '#475569', bg: '#E2E8F0' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['1.75rem', { lineHeight: '2.1rem', fontWeight: '600' }],
        section: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.4rem', fontWeight: '400' }],
        caption: ['0.8125rem', { lineHeight: '1.15rem', fontWeight: '400' }],
      },
      boxShadow: {
        panel: '0 1px 2px 0 rgba(26, 29, 31, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
