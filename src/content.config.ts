import { postsCollection } from '@sonapraneeth/blog-core/content';

export const collections = {
  // Posts live under the top-level `content/` directory.
  blog: postsCollection('./content'),
};
