import { useEffect } from 'react';

interface PageMeta {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  keywords?: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'restaurant';
  structuredData?: Record<string, unknown>;
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

function setStructuredData(data: Record<string, unknown>) {
  let el = document.getElementById('structured-data-ld');
  if (!el) {
    el = document.createElement('script');
    el.id = 'structured-data-ld';
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function usePageMeta(meta: PageMeta, lang: string) {
  useEffect(() => {
    const title = lang === 'ar' ? meta.titleAr : meta.titleEn;
    const siteTitle = 'Tabaq | طبق';
    const fullTitle = title === siteTitle ? title : `${title} — ${siteTitle}`;
    document.title = fullTitle;

    const description = lang === 'ar'
      ? (meta.descriptionAr ?? meta.descriptionEn ?? '')
      : (meta.descriptionEn ?? '');

    // Basic meta
    setMeta('description', description);
    if (meta.keywords) setMeta('keywords', meta.keywords);

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', meta.type ?? 'website', true);
    setMeta('og:locale', lang === 'ar' ? 'ar_SA' : 'en_US', true);
    if (meta.imageUrl) {
      setMeta('og:image', meta.imageUrl, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
    }

    // Twitter Card
    setMeta('twitter:card', meta.imageUrl ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (meta.imageUrl) setMeta('twitter:image', meta.imageUrl);

    // Schema.org Structured Data
    if (meta.structuredData) {
      setStructuredData(meta.structuredData);
    }
  }, [meta.titleEn, meta.titleAr, meta.descriptionEn, meta.descriptionAr, meta.keywords, meta.imageUrl, meta.type, lang]);
}

/* Helper: build Restaurant structured data (Schema.org) */
export function buildRestaurantSchema(opts: {
  name: string;
  description?: string;
  image?: string;
  address?: string;
  phone?: string;
  url?: string;
  cuisine?: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: opts.name,
    description: opts.description,
    image: opts.image,
    address: opts.address ? { '@type': 'PostalAddress', streetAddress: opts.address } : undefined,
    telephone: opts.phone,
    url: opts.url,
    servesCuisine: opts.cuisine,
    priceRange: opts.priceRange,
    aggregateRating: opts.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: opts.rating,
          reviewCount: opts.reviewCount ?? 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}
