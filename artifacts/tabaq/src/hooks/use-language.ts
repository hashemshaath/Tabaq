import { useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

function safeStorage(fn: () => string | null | void): string | null {
  try { return (fn() as string | null) ?? null; } catch { return null; }
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    const stored = safeStorage(() => localStorage.getItem('tabaq_lang'));
    return (stored as Language) || 'en';
  });

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    safeStorage(() => { localStorage.setItem('tabaq_lang', lang); return null; });
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  return { lang, setLang, toggleLanguage, t, isRtl: lang === 'ar' };
}
