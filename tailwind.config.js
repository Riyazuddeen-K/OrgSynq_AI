/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      colors: {
        surface: {
          light: '#F5F6FA',
          lightcard: '#FFFFFF',
          dark: '#0A0C12',
          darkcard: '#12151F',
          darkborder: '#1E2230',
          lightborder: '#E4E6EF'
        },
        signal: {
          DEFAULT: '#6C5CE7',
          soft: '#8B7FF0',
          dim: 'rgba(108,92,231,0.14)'
        },
        amber: {
          DEFAULT: '#F5A524'
        },
        rose: {
          DEFAULT: '#F43F5E'
        },
        teal: {
          DEFAULT: '#12B886'
        },
        dept: {
          engineering: '#3B82F6',
          product: '#8B5CF6',
          design: '#EC4899',
          marketing: '#F5A524',
          sales: '#22C55E',
          hr: '#06B6D4',
          finance: '#F43F5E',
          operations: '#14B8A6'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,18,27,0.04), 0 8px 24px -12px rgba(16,18,27,0.12)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
