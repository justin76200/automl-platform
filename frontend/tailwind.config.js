/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface:  '#0D1117',
        panel:    '#161B22',
        card:     '#21262D',
        border:   '#30363D',
        'border-light': '#3D444D',
        accent:   '#7C3AED',
        'accent-hover': '#8B5CF6',
        'accent-muted': '#7C3AED22',
        // node category colours
        node: {
          dataset:    '#0EA5E9',
          pre:        '#A855F7',
          model:      '#F59E0B',
          tuner:      '#10B981',
        },
        text: {
          primary:   '#E6EDF3',
          secondary: '#8B949E',
          muted:     '#6E7681',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'node': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.4)',
        'node-selected': '0 0 0 2px #7C3AED',
      },
    },
  },
  plugins: [],
}
