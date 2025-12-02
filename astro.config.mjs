// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

import cloudflare from '@astrojs/cloudflare';

import relativeLinks from 'astro-relative-links';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  site: 'https://sinta.fun/',
  //base: 'https://sinta.fun/',
  adapter: cloudflare(),
  integrations: [relativeLinks()],
});