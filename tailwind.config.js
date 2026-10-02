/** @type {import('tailwindcss').Config} */
// Design token diadaptasi dari file referensi HTML (InterpretaSync).
// Token semantik di-mapping ke CSS variable (channel RGB) agar mendukung
// light & dark mode via strategi class. Nilai per-mode ada di src/index.css.
// Format rgb(var(--c) / <alpha-value>) menjaga modifier alpha (mis. /10) tetap jalan.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // --- Token semantik (flip antara light/dark via CSS variable) ---
        background: v('--c-background'),
        surface: v('--c-surface'),
        'surface-dim': v('--c-surface-dim'),
        'surface-bright': v('--c-surface-bright'),
        'surface-container-lowest': v('--c-surface-container-lowest'),
        'surface-container-low': v('--c-surface-container-low'),
        'surface-container': v('--c-surface-container'),
        'surface-container-high': v('--c-surface-container-high'),
        'surface-container-highest': v('--c-surface-container-highest'),
        'surface-variant': v('--c-surface-variant'),
        'on-surface': v('--c-on-surface'),
        'on-background': v('--c-on-background'),
        'on-surface-variant': v('--c-on-surface-variant'),
        outline: v('--c-outline'),
        'outline-variant': v('--c-outline-variant'),
        primary: v('--c-primary'),
        'primary-container': v('--c-primary-container'),
        'on-primary': v('--c-on-primary'),
        'on-primary-container': v('--c-on-primary-container'),
        secondary: v('--c-secondary'),
        'secondary-container': v('--c-secondary-container'),
        'on-secondary': v('--c-on-secondary'),
        'on-secondary-container': v('--c-on-secondary-container'),
        tertiary: v('--c-tertiary'),
        error: v('--c-error'),
        'on-error': v('--c-on-error'),
        // Warna semantik tambahan (inventaris & notifikasi)
        warning: '#d97706', // amber-600
        success: '#16a34a', // green-600

        // --- Token Material lain (jarang dipakai, tetap statis) ---
        'on-tertiary': '#381680',
        'on-tertiary-fixed-variant': '#4f3298',
        'surface-tint': '#acc7ff',
        'primary-fixed': '#d7e2ff',
        'error-container': '#93000a',
        'on-secondary-fixed-variant': '#005141',
        'tertiary-container': '#9b7fe8',
        'on-secondary-fixed': '#002019',
        'primary-fixed-dim': '#acc7ff',
        'on-primary-fixed-variant': '#004492',
        'tertiary-fixed': '#e9ddff',
        'inverse-primary': '#005bbf',
        'inverse-on-surface': '#2f2e43',
        'on-primary-fixed': '#001a40',
        'secondary-fixed': '#6ff9d6',
        'on-tertiary-fixed': '#22005d',
        'secondary-fixed-dim': '#4eddbb',
        'on-error-container': '#ffdad6',
        'on-tertiary-container': '#320a7a',
        'tertiary-fixed-dim': '#cfbdff',
        'inverse-surface': '#e2e0fc',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        xxl: '1rem',
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
        huge: '48px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        h1: ['Inter'],
        h2: ['Inter'],
        h3: ['Inter'],
        body: ['Inter'],
        caption: ['Inter'],
        'label-tag': ['Inter'],
      },
      fontSize: {
        h1: ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '500' }],
        body: ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0em', fontWeight: '400' }],
        'label-tag': ['11px', { lineHeight: '12px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      keyframes: {
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // Pulse subtle (ungu) untuk badge "Waiting for Approval".
        'glow-purple': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.45)' },
          '50%': { boxShadow: '0 0 0 3px rgba(124, 58, 237, 0)' },
        },
        // Pulse lebih menonjol (merah) untuk badge "Overdue".
        'glow-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.55)' },
          '50%': { boxShadow: '0 0 0 4px rgba(220, 38, 38, 0)' },
        },
      },
      animation: {
        'modal-in': 'modal-in 0.18s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'toast-in': 'toast-in 0.25s ease-out',
        'glow-purple': 'glow-purple 2s ease-out infinite',
        'glow-red': 'glow-red 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
}
