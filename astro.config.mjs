import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const sitemapExcludedPaths = new Set([
  '/404',
  '/barometre-manifest.json',
  '/pages/efficity',
  '/pages/llms-txt',
]);

export default defineConfig({
  site: 'https://score-immo.fr',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
        return !pathname.startsWith('/admin') && !sitemapExcludedPaths.has(pathname);
      },
    }),
  ],
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
