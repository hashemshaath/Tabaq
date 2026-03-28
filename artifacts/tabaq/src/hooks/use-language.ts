import { useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tabaq_lang') as Language) || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('tabaq_lang', lang);
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  // Translation helper
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  return { lang, setLang, toggleLanguage, t, isRtl: lang === 'ar' };
}
