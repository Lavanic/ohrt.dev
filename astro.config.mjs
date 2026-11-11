// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ohrt.dev',
  build: { inlineStylesheets: 'always' },
  vite: { build: { cssTarget: ['safari14', 'chrome87', 'firefox78', 'edge88'] } },
});
