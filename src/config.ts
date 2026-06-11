/**
 * Central site configuration. Edit these values to rebrand the blog.
 */
export const siteConfig = {
  /** Short brand shown in the header. */
  brand: 'Grihasetu',
  /** Full site name used in <title> and metadata. */
  title: 'Grihasetu Blog',
  /** Default meta description / tagline. */
  description:
    'Engineering notes, deep dives and field reports — built with Astro, MDX and a lot of care for performance.',
  /** Author shown in post bylines and the footer. */
  author: 'Grihasetu',
  /** Posts per page on the home feed and taxonomy listings. */
  pageSize: 7,
  /** IANA time zone used to render post timestamps. */
  timeZone: 'Asia/Kolkata',
  /** Human-readable abbreviation appended after timestamps (e.g. IST, UTC). */
  timeZoneLabel: 'IST',
};

export interface NavLink {
  href: string;
  label: string;
  /** Inner SVG markup (24x24, stroke-based) for the mobile tab bar. */
  icon: string;
}

export const navLinks: NavLink[] = [
  {
    href: '/',
    label: 'Home',
    icon: '<path d="M3 9.5 12 3l9 6.5"></path><path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"></path><path d="M9 21v-6h6v6"></path>',
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
  },
  {
    href: '/tags',
    label: 'Tags',
    icon: '<path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59A2 2 0 0 0 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z"></path><circle cx="7" cy="7" r="1.2"></circle>',
  },
  {
    href: '/search',
    label: 'Search',
    icon: '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
  },
];

export interface SocialProfile {
  id: string;
  href: string;
  label: string;
  icon: string;
}

/**
 * Social links rendered in the footer. Set href to '' (or remove the entry) to
 * hide a profile.
 */
export const socialProfiles: SocialProfile[] = [
  {
    id: 'github',
    href: 'https://github.com/grihasetu',
    label: 'GitHub',
    icon: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path>',
  },
  {
    id: 'rss',
    href: '/rss.xml',
    label: 'RSS',
    icon: '<path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1.4"></circle>',
  },
];

export const activeSocials = socialProfiles.filter((p) => p.href !== '');
