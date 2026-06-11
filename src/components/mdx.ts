/**
 * Shared MDX components.
 *
 * Two ways to use them in a post:
 *
 * 1. Auto-mapped (no import needed) — these names are passed to <Content /> on
 *    the post page, so you can write <Callout>, <Tabs>, <TabItem> directly.
 *
 * 2. Explicit import for anything custom:
 *      import { Callout, Tabs, TabItem } from '@components/mdx';
 *
 * To register your OWN component for auto-mapping, add it to `mdxComponents`
 * below and it becomes available in every post without an import.
 */
import Callout from './Callout.astro';
import Tabs from './Tabs.astro';
import TabItem from './TabItem.astro';
import { Code } from 'astro-expressive-code/components';

export { Callout, Tabs, TabItem, Code };

/** Components auto-injected into every MDX post via <Content components={...} />. */
export const mdxComponents = {
  Callout,
  Tabs,
  TabItem,
  Code,
};
