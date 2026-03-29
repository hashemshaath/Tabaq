import { useLocalization } from '@/context/LocalizationContext';

export type Language = 'en' | 'ar';

export function useLanguage() {
  const { language, setLanguage, t, isRtl, country } = useLocalization();

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return {
    lang: language,
    setLang: setLanguage,
    toggleLanguage,
    t,
    isRtl,
    country,
  };
}
