import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Permite el cambio de tema mediante la clase .dark en el html
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        display: [
          '3.5rem',
          { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' },
        ],
        'display-sm': [
          '2.5rem',
          { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.02em' },
        ],
        h1: [
          '2rem',
          { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' },
        ],
        'h1-sm': [
          '1.75rem',
          { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' },
        ],
        h2: [
          '1.5rem',
          { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        'h2-sm': [
          '1.25rem',
          { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.01em' },
        ],
        h3: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3-sm': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        h4: ['0.9375rem', { lineHeight: '1.5', fontWeight: '600' }],
        'h4-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption-sm': ['0.6875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // 🚀 COLORES EXTERNOS
        external: {
          airbnb: '#FF5A5F',
          booking: '#003580',
          mercadopago: '#00BCFF',
          facebook: '#1877F2',
          whatsapp: '#25D366',
          usdt: '#26a17b',
          google: {
            blue: '#4285F4',
            green: '#34A853',
            yellow: '#FBBC05',
            red: '#EA4335',
          },
        },
        // 🎨 SISTEMA SEMÁNTICO
        supportive: {
          success: '#397523',
          'success-muted': '#EBFCE4',
          warning: '#F98F44',
          'warning-muted': '#FDE4CE',
          info: 'hsl(var(--brand-blue-dark))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // 💎 MARCA
        brand: {
          blue: {
            light: 'hsl(var(--brand-blue-light))',
            medium: 'hsl(var(--brand-blue-medium))',
            dark: 'hsl(var(--brand-blue-dark))',
            darker: 'hsl(var(--brand-blue-darker))',
          },
        },
      },
      // ✨ SISTEMA DE SOMBRAS (Resuelve el error de globals.css)
      boxShadow: {
        'soft-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
        'brand-glow': '0 0 20px -5px hsl(var(--brand-blue-medium) / 0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)', opacity: '0.2' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        blob: 'blob 7s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
