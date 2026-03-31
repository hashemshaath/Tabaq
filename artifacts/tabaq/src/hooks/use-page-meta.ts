import { useEffect } from 'react';

const SITE_NAME = 'Tabaq | طبق';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://tabaq.sa';

interface PageMeta {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  keywords?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'restaurant';
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  canonical?: string;
  noIndex?: boolean;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(name: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.remove();
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra
    ? `link[rel="${rel}"]${Object.entries(extra).map(([k, v]) => `[${k}="${v}"]`).join('')}`
    : `link[rel="${rel}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  (el as HTMLLinkElement).href = href;
}

function removeLinks(rel: string) {
  document.querySelectorAll(`link[rel="${rel}"]`).forEach(el => el.remove());
}

function setStructuredData(data: Record<string, unknown> | Record<string, unknown>[]) {
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
  const schemas = Array.isArray(data) ? data : [data];
  schemas.forEach(schema => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(el);
  });
}

export function usePageMeta(meta: PageMeta, lang: string) {
  useEffect(() => {
    const title = lang === 'ar' ? meta.titleAr : meta.titleEn;
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    const description = lang === 'ar'
      ? (meta.descriptionAr ?? meta.descriptionEn ?? '')
      : (meta.descriptionEn ?? '');

    // Robots
    if (meta.noIndex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow');
    }

    // Basic meta
    setMeta('description', description);
    if (meta.keywords) setMeta('keywords', meta.keywords);

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', meta.type === 'article' ? 'article' : 'website', true);
    setMeta('og:locale', lang === 'ar' ? 'ar_SA' : 'en_US', true);
    setMeta('og:locale:alternate', lang === 'ar' ? 'en_US' : 'ar_SA', true);
    setMeta('og:site_name', SITE_NAME, true);
    if (meta.imageUrl) {
      setMeta('og:image', meta.imageUrl, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
      setMeta('og:image:alt', fullTitle, true);
    }

    // Twitter Card
    setMeta('twitter:card', meta.imageUrl ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:site', '@TabaqSA');
    if (meta.imageUrl) setMeta('twitter:image', meta.imageUrl);

    // Canonical URL
    const canonicalHref = meta.canonical ?? (SITE_URL + window.location.pathname);
    setLink('canonical', canonicalHref);

    // hreflang
    removeLinks('alternate');
    const currentPath = window.location.pathname;
    setLink('alternate', SITE_URL + currentPath, { hreflang: 'ar' });
    setLink('alternate', SITE_URL + currentPath, { hreflang: 'en' });
    setLink('alternate', SITE_URL + currentPath, { hreflang: 'x-default' });

    // Schema.org Structured Data
    if (meta.structuredData) {
      setStructuredData(meta.structuredData);
    }
  }, [
    meta.titleEn, meta.titleAr, meta.descriptionEn, meta.descriptionAr,
    meta.keywords, meta.imageUrl, meta.type, meta.canonical, meta.noIndex, lang,
  ]);
}

/* ─────────────────────────────────────────────────────
   Schema.org Builder Helpers
───────────────────────────────────────────────────── */

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tabaq | طبق',
    alternateName: 'طبق',
    url: 'https://tabaq.sa',
    description: 'Saudi Arabia\'s #1 restaurant discovery and reservation platform. Find, book, and review top restaurants across Riyadh, Jeddah, Dammam and the GCC.',
    inLanguage: ['ar-SA', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tabaq.sa/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tabaq | طبق',
      url: 'https://tabaq.sa',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tabaq.sa/images/tabaq-logo.png',
        width: 200,
        height: 60,
      },
      sameAs: [
        'https://twitter.com/TabaqSA',
        'https://instagram.com/TabaqSA',
        'https://www.linkedin.com/company/tabaq-sa',
      ],
    },
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tabaq | طبق',
    url: 'https://tabaq.sa',
    logo: 'https://tabaq.sa/images/tabaq-logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Saudi Arabia',
    },
  };
}

export function buildRestaurantSchema(opts: {
  id: number | string;
  name: string;
  nameAr?: string;
  description?: string;
  image?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  url?: string;
  cuisine?: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  openingHours?: string[];
  latitude?: number;
  longitude?: number;
  hasMenu?: boolean;
  menuUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `https://tabaq.sa/restaurants/${opts.id}`,
    name: opts.name,
    alternateName: opts.nameAr,
    description: opts.description,
    image: opts.image,
    url: opts.url ?? `https://tabaq.sa/restaurants/${opts.id}`,
    telephone: opts.phone,
    servesCuisine: opts.cuisine,
    priceRange: opts.priceRange,
    openingHoursSpecification: opts.openingHours?.map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h })),
    address: {
      '@type': 'PostalAddress',
      streetAddress: opts.address,
      addressLocality: opts.city ?? 'Riyadh',
      addressRegion: opts.city ?? 'Riyadh',
      addressCountry: opts.country ?? 'SA',
    },
    geo: opts.latitude && opts.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: opts.latitude,
      longitude: opts.longitude,
    } : undefined,
    aggregateRating: opts.rating ? {
      '@type': 'AggregateRating',
      ratingValue: opts.rating,
      reviewCount: opts.reviewCount ?? 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    hasMenu: opts.hasMenu ? (opts.menuUrl ?? `https://tabaq.sa/restaurants/${opts.id}#menu`) : undefined,
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://tabaq.sa/restaurants/${opts.id}?action=book`,
      },
    },
  };
}

export function buildArticleSchema(opts: {
  slug: string;
  titleEn: string;
  titleAr?: string;
  excerpt?: string;
  coverImage?: string;
  authorName: string;
  authorUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  categoryName?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://tabaq.sa/blog/${opts.slug}`,
    headline: opts.titleEn,
    alternativeHeadline: opts.titleAr,
    description: opts.excerpt,
    image: opts.coverImage ? {
      '@type': 'ImageObject',
      url: opts.coverImage,
      width: 1200,
      height: 630,
    } : undefined,
    url: `https://tabaq.sa/blog/${opts.slug}`,
    datePublished: opts.publishedAt,
    dateModified: opts.updatedAt ?? opts.publishedAt,
    author: {
      '@type': 'Person',
      name: opts.authorName,
      url: opts.authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tabaq | طبق',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tabaq.sa/images/tabaq-logo.png',
      },
    },
    articleSection: opts.categoryName,
    keywords: opts.tags?.join(', '),
    inLanguage: ['en-US', 'ar-SA'],
    isPartOf: {
      '@type': 'Blog',
      name: 'Tabaq Food Blog',
      url: 'https://tabaq.sa/blog',
    },
  };
}

export function buildBreadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildMenuSchema(opts: {
  restaurantId: number | string;
  restaurantName: string;
  sections: { name: string; items: { name: string; description?: string; price?: number; currency?: string }[] }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `https://tabaq.sa/restaurants/${opts.restaurantId}#menu`,
    name: `${opts.restaurantName} Menu`,
    url: `https://tabaq.sa/restaurants/${opts.restaurantId}#menu`,
    hasMenuSection: opts.sections.map(section => ({
      '@type': 'MenuSection',
      name: section.name,
      hasMenuItem: section.items.map(item => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        offers: item.price ? {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: item.currency ?? 'SAR',
        } : undefined,
      })),
    })),
  };
}

export function buildDishSchema(opts: {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  restaurantName?: string;
  restaurantId?: number;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    '@id': `https://tabaq.sa/dishes/${opts.id}`,
    name: opts.name,
    description: opts.description,
    image: opts.image,
    url: `https://tabaq.sa/dishes/${opts.id}`,
    offers: opts.price ? {
      '@type': 'Offer',
      price: opts.price,
      priceCurrency: opts.currency ?? 'SAR',
      availability: 'https://schema.org/InStock',
    } : undefined,
    aggregateRating: opts.rating ? {
      '@type': 'AggregateRating',
      ratingValue: opts.rating,
      reviewCount: opts.reviewCount ?? 0,
      bestRating: 5,
    } : undefined,
    suitableForDiet: ['https://schema.org/HalalDiet'],
  };
}

export function buildEventSchema(opts: {
  id: number | string;
  name: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  locationName?: string;
  locationAddress?: string;
  price?: number;
  currency?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FoodEvent',
    '@id': `https://tabaq.sa/events/${opts.id}`,
    name: opts.name,
    description: opts.description,
    image: opts.image,
    startDate: opts.startDate,
    endDate: opts.endDate,
    url: opts.url ?? `https://tabaq.sa/events/${opts.id}`,
    location: {
      '@type': 'Place',
      name: opts.locationName ?? 'Tabaq Platform',
      address: opts.locationAddress,
    },
    offers: opts.price ? {
      '@type': 'Offer',
      price: opts.price,
      priceCurrency: opts.currency ?? 'SAR',
      url: `https://tabaq.sa/events/${opts.id}`,
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'Tabaq | طبق',
      url: 'https://tabaq.sa',
    },
  };
}

export function buildReviewSchema(opts: {
  restaurantId: number;
  restaurantName: string;
  rating: number;
  reviewBody?: string;
  authorName?: string;
  datePublished?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Restaurant',
      '@id': `https://tabaq.sa/restaurants/${opts.restaurantId}`,
      name: opts.restaurantName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: opts.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: opts.reviewBody,
    author: {
      '@type': 'Person',
      name: opts.authorName ?? 'Tabaq User',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tabaq | طبق',
    },
    datePublished: opts.datePublished,
  };
}
