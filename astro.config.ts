import { defineBlogAstroConfig } from '@sonapraneeth/blog-core/astro';
import { blogConfig } from './blog.config';

// The blog engine (@sonapraneeth/blog-core) owns all page routing, search, the
// Markdown/MDX pipeline, fonts and theming. This site only supplies its config,
// content collection and component registry. PUBLIC_SITE_URL overrides the site
// URL per environment (dev/test/ppe/prod).
export default defineBlogAstroConfig({ port: 4322, blogConfig });
