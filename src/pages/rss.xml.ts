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
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category, ...post.data.tags],
      link: `/blog/${post.id}`,
    })),
  });
}
