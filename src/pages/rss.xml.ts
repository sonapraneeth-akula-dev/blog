import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { siteConfig } from '@/config';
import { getPublishedPosts } from '@/utils/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? 'http://localhost:4322',
    // Declare the Atom namespace so each item can carry a last-edited date;
    // RSS 2.0 itself only has <pubDate>, while <atom:updated> is the standard
    // way to express when an entry was last modified.
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category, ...post.data.tags],
      link: `/blog/${post.id}`,
      customData: post.data.updatedDate
        ? `<atom:updated>${post.data.updatedDate.toISOString()}</atom:updated>`
        : undefined,
    })),
  });
}
