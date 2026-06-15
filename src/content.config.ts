import { postsCollection } from '@grihasetu/blog-core/content';

export const collections = {
  // Posts live under `src/content/blog`.
  blog: postsCollection('./src/content/blog'),
};
