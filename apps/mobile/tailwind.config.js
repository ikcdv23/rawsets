/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — backed by CSS vars in global.css so Fase 2 can flip to dark.
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          bright: 'rgb(var(--color-primary-bright) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        slate: 'rgb(var(--color-slate) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-bold': ['Inter_700Bold'],
        'sans-black': ['Inter_900Black'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-bold': ['JetBrainsMono_700Bold'],
        display: ['ZenDots_400Regular'],
      },
    },
  },
  plugins: [],
};
