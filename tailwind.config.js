/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif']
      },
      colors: {
        surface: {
          light: '#F8FAFC',
          lightcard: '#FFFFFF',
          lightelevated: '#F1F5F9',
          lightborder: '#E2E8F0',
          dark: '#080B11',
          darkcard: '#0E131F',
          darkelevated: '#141A29',
          darkborder: '#1A2234'
        },
        signal: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          soft: '#A5B4FC',
          dim: 'rgba(99, 102, 241, 0.12)',
          glow: 'rgba(99, 102, 241, 0.35)'
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245, 158, 11, 0.12)',
          glow: 'rgba(245, 158, 11, 0.3)'
        },
        rose: {
          DEFAULT: '#F43F5E',
          dim: 'rgba(244, 63, 94, 0.12)',
          glow: 'rgba(244, 63, 94, 0.3)'
        },
        teal: {
          DEFAULT: '#10B981',
          dim: 'rgba(16, 185, 129, 0.12)',
          glow: 'rgba(16, 185, 129, 0.3)'
        },
        cyan: {
          DEFAULT: '#06B6D4',
          dim: 'rgba(6, 182, 212, 0.12)'
        },
        dept: {
          engineering: '#3B82F6',
          product: '#8B5CF6',
          design: '#EC4899',
          marketing: '#F59E0B',
          sales: '#10B981',
          hr: '#06B6D4',
          finance: '#F43F5E',
          operations: '#14B8A6'
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.03), 0 8px 24px -6px rgba(0,0,0,0.05)',
        'card-hover': '0 12px 32px -6px rgba(0,0,0,0.1), 0 4px 12px -2px rgba(0,0,0,0.05)',
        'glow-signal': '0 0 25px -4px rgba(99, 102, 241, 0.35)',
        'glow-teal': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(244, 63, 94, 0.35)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)'
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.5rem'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
}
