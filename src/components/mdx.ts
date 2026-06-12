/**
 * Shared MDX components.
 *
 * Two ways to use them in a post:
 *
 * 1. Auto-mapped (no import needed) — these names are passed to <Content /> on
 *    the post page, so you can write <Callout>, <Tabs>, <Card>, … directly.
 *
 * 2. Explicit import for anything custom:
 *      import { Callout, Card, Steps } from '@components/mdx';
 *
 * To register your OWN component for auto-mapping, add it to `mdxComponents`
 * below and it becomes available in every post without an import.
 */
import Callout from './Callout.astro';
import Tabs from './Tabs.astro';
import TabItem from './TabItem.astro';
import Card from './Card.astro';
import CardGrid from './CardGrid.astro';
import LinkCard from './LinkCard.astro';
import Badge from './Badge.astro';
import LinkButton from './LinkButton.astro';
import Steps from './Steps.astro';
import FileTree from './FileTree.astro';
import Icon from './Icon.astro';
import { Code } from 'astro-expressive-code/components';

export {
  Callout,
  Tabs,
  TabItem,
  Card,
  CardGrid,
  LinkCard,
  Badge,
  LinkButton,
  Steps,
  FileTree,
  Icon,
  Code,
};

/** Components auto-injected into every MDX post via <Content components={...} />. */
export const mdxComponents = {
  Callout,
  Tabs,
  TabItem,
  Card,
  CardGrid,
  LinkCard,
  Badge,
  LinkButton,
  Steps,
  FileTree,
  Icon,
  Code,
};
