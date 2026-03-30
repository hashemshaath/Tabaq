import { useEffect } from 'react';

interface PageMeta {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export function usePageMeta(meta: PageMeta, lang: string) {
  useEffect(() => {
    const title = lang === 'ar' ? meta.titleAr : meta.titleEn;
    document.title = title;

    const description = lang === 'ar'
      ? (meta.descriptionAr ?? meta.descriptionEn ?? '')
      : (meta.descriptionEn ?? '');

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);
  }, [meta.titleEn, meta.titleAr, meta.descriptionEn, meta.descriptionAr, lang]);
}
