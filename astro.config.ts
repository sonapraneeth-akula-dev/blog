import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// Environment-aware site URL. Set PUBLIC_SITE_URL per environment (dev/test/ppe/prod).
const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4322';

export default defineConfig({
  site,
  // Expressive Code must be registered BEFORE MDX so it can process fenced code
  // blocks inside .mdx files. It replaces the default Shiki highlighter and adds
  // copy buttons, frames, line numbers and per-line/text markers.
  integrations: [
    expressiveCode({
      // Dual theme: a light + a high-contrast dark theme (WCAG AA, per the
      // Lighthouse playbook). Theme switching is driven by the same
      // html[data-theme] attribute the site uses, with a media query fallback
      // for the "system" (no attribute) mode.
      themes: ['github-light', 'github-dark-high-contrast'],
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      useDarkModeMediaQuery: true,
      plugins: [pluginLineNumbers()],
      defaultProps: {
        // Off by default; opt in per block with showLineNumbers.
        showLineNumbers: false,
      },
      styleOverrides: {
        borderRadius: 'var(--radius)',
        borderColor: 'var(--border)',
        codeFontFamily: 'var(--font-mono)',
        uiFontFamily: 'var(--font-sans)',
        frames: {
          shadowColor: 'transparent',
        },
      },
    }),
    mdx(),
    sitemap(),
  ],
  compressHTML: true,
  markdown: {
    // Astro 6 moved remark/rehype plugin config under `processor`. `unified()`
    // builds the default remark/rehype pipeline and lets us extend it.
    processor: unified({
      // Add an id to every heading, then a small clickable anchor link beside it.
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
            // An icon element (no text node) so the "#" never leaks into the
            // table-of-contents heading text that Astro extracts.
            content: {
              type: 'element',
              tagName: 'svg',
              properties: {
                width: 15,
                height: 15,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              },
              children: [
                {
                  type: 'element',
                  tagName: 'path',
                  properties: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
                  children: [],
                },
                {
                  type: 'element',
                  tagName: 'path',
                  properties: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
                  children: [],
                },
              ],
            },
          },
        ],
      ],
    }),
  },
  // Self-host Google Fonts at build time (Astro Fonts API): removes the
  // fonts.googleapis.com / fonts.gstatic.com origins from the critical path and
  // ships metric-matched fallbacks to avoid layout shift. Variable ranges,
  // normal style and latin subset only keep the payload minimal.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-sans-files',
      weights: ['300 800'],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-heading-files',
      weights: ['300 700'],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono-files',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 4322,
  },
  vite: {
    server: { allowedHosts: true },
    preview: { allowedHosts: true },
    build: {
      rollupOptions: {
        // Pagefind's runtime is generated into /pagefind/ during the build step
        // and only exists in the final output — never bundle it.
        external: [/^\/pagefind\//],
      },
    },
  },
});
