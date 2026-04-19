export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette ScoreImmo extraite du thème Shopify
        'si-navy': '#1e3a5f',
        'si-navy-dark': '#0f1e35',
        'si-blue': '#2563eb',
        'si-blue-light': '#3b82f6',
        'si-gold': '#d4a574',
        'si-bg': '#fafbfc',
        'si-border': '#e2e8f0',
        'si-text': '#0f172a',
        'si-muted': '#64748b',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
