import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CountryConfig {
  code: string;
  nameEn: string;
  nameAr: string;
  flag: string;
  phonePrefix: string;
  currency: {
    code: string;
    symbol: string;
    symbolAr: string;
    decimals: number;
    position: 'before' | 'after';
  };
  timezone: string;
  timezoneLabel: string;
  vat: {
    rate: number;
    label: string;
    labelAr: string;
    registrationLabel: string;
  };
  languages: ('en' | 'ar')[];
  defaultLanguage: 'en' | 'ar';
  addressFormat: 'standard' | 'saudi' | 'uae' | 'kuwait';
  postalCodeLabel?: string;
  postalCodeLabelAr?: string;
  regions?: string[];
  regionsAr?: string[];
  nationalAddressEnabled: boolean;
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  SA: {
    code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', flag: '🇸🇦',
    phonePrefix: '+966',
    currency: { code: 'SAR', symbol: 'SAR', symbolAr: 'ر.س', decimals: 2, position: 'before' },
    timezone: 'Asia/Riyadh', timezoneLabel: 'Arabian Standard Time (UTC+3)',
    vat: { rate: 15, label: 'VAT', labelAr: 'ضريبة القيمة المضافة', registrationLabel: 'VAT Registration Number' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'saudi', nationalAddressEnabled: true,
    postalCodeLabel: 'Postal Code', postalCodeLabelAr: 'الرمز البريدي',
    regions: ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Bahah', 'Al Jawf', 'Qassim'],
    regionsAr: ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف', 'القصيم'],
  },
  AE: {
    code: 'AE', nameEn: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪',
    phonePrefix: '+971',
    currency: { code: 'AED', symbol: 'AED', symbolAr: 'د.إ', decimals: 2, position: 'before' },
    timezone: 'Asia/Dubai', timezoneLabel: 'Gulf Standard Time (UTC+4)',
    vat: { rate: 5, label: 'VAT', labelAr: 'ضريبة القيمة المضافة', registrationLabel: 'TRN (Tax Registration Number)' },
    languages: ['ar', 'en'], defaultLanguage: 'en',
    addressFormat: 'uae', nationalAddressEnabled: false,
    regions: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
    regionsAr: ['أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة'],
  },
  KW: {
    code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼',
    phonePrefix: '+965',
    currency: { code: 'KWD', symbol: 'KWD', symbolAr: 'د.ك', decimals: 3, position: 'before' },
    timezone: 'Asia/Kuwait', timezoneLabel: 'Arabian Standard Time (UTC+3)',
    vat: { rate: 0, label: 'No VAT', labelAr: 'لا ضريبة', registrationLabel: '' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'kuwait', nationalAddressEnabled: false,
    regions: ['Al Asimah', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra', 'Mubarak Al-Kabeer'],
    regionsAr: ['العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير'],
  },
  BH: {
    code: 'BH', nameEn: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭',
    phonePrefix: '+973',
    currency: { code: 'BHD', symbol: 'BHD', symbolAr: 'د.ب', decimals: 3, position: 'before' },
    timezone: 'Asia/Bahrain', timezoneLabel: 'Arabian Standard Time (UTC+3)',
    vat: { rate: 10, label: 'VAT', labelAr: 'ضريبة القيمة المضافة', registrationLabel: 'VAT Registration Number' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'standard', nationalAddressEnabled: false,
    regions: ['Capital', 'Northern', 'Southern', 'Muharraq'],
    regionsAr: ['العاصمة', 'الشمالية', 'الجنوبية', 'المحرق'],
  },
  QA: {
    code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦',
    phonePrefix: '+974',
    currency: { code: 'QAR', symbol: 'QAR', symbolAr: 'ر.ق', decimals: 2, position: 'before' },
    timezone: 'Asia/Qatar', timezoneLabel: 'Arabian Standard Time (UTC+3)',
    vat: { rate: 0, label: 'No VAT', labelAr: 'لا ضريبة', registrationLabel: '' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'standard', nationalAddressEnabled: false,
    regions: ['Ad Dawhah', 'Al Khor', 'Al Wakrah', 'Al Rayyan', 'Al Shamal', 'Umm Salal', 'Al Daayen', 'Al Sheehaniya'],
    regionsAr: ['الدوحة', 'الخور', 'الوكرة', 'الريان', 'الشمال', 'أم صلال', 'الضعاين', 'الشحانية'],
  },
  OM: {
    code: 'OM', nameEn: 'Oman', nameAr: 'عُمان', flag: '🇴🇲',
    phonePrefix: '+968',
    currency: { code: 'OMR', symbol: 'OMR', symbolAr: 'ر.ع', decimals: 3, position: 'before' },
    timezone: 'Asia/Muscat', timezoneLabel: 'Gulf Standard Time (UTC+4)',
    vat: { rate: 5, label: 'VAT', labelAr: 'ضريبة القيمة المضافة', registrationLabel: 'Tax Registration Number' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'standard', nationalAddressEnabled: false,
    regions: ['Muscat', 'Dhofar', 'Al Batinah North', 'Al Batinah South', 'Al Dakhiliyah', 'Al Sharqiyah', 'Al Wusta', 'Musandam', 'Al Buraymi'],
    regionsAr: ['مسقط', 'ظفار', 'شمال الباطنة', 'جنوب الباطنة', 'الداخلية', 'الشرقية', 'الوسطى', 'مسندم', 'البريمي'],
  },
  EG: {
    code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', flag: '🇪🇬',
    phonePrefix: '+20',
    currency: { code: 'EGP', symbol: 'EGP', symbolAr: 'ج.م', decimals: 2, position: 'before' },
    timezone: 'Africa/Cairo', timezoneLabel: 'Eastern European Time (UTC+2)',
    vat: { rate: 14, label: 'VAT', labelAr: 'ضريبة القيمة المضافة', registrationLabel: 'Tax Registration Number' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'standard', nationalAddressEnabled: false,
    regions: ['Cairo', 'Giza', 'Alexandria', 'Aswan', 'Luxor', 'Suez', 'Red Sea', 'North Sinai', 'South Sinai'],
    regionsAr: ['القاهرة', 'الجيزة', 'الإسكندرية', 'أسوان', 'الأقصر', 'السويس', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء'],
  },
  JO: {
    code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴',
    phonePrefix: '+962',
    currency: { code: 'JOD', symbol: 'JOD', symbolAr: 'د.أ', decimals: 3, position: 'before' },
    timezone: 'Asia/Amman', timezoneLabel: 'Arabian Standard Time (UTC+3)',
    vat: { rate: 16, label: 'Sales Tax', labelAr: 'ضريبة المبيعات', registrationLabel: 'Tax Number' },
    languages: ['ar', 'en'], defaultLanguage: 'ar',
    addressFormat: 'standard', nationalAddressEnabled: false,
    regions: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Mafraq', 'Jerash', 'Ajloun', 'Karak', 'Tafilah', 'Maan', 'Balqa'],
    regionsAr: ['عمّان', 'الزرقاء', 'إربد', 'العقبة', 'مأدبا', 'المفرق', 'جرش', 'عجلون', 'الكرك', 'الطفيلة', 'معان', 'البلقاء'],
  },
};

export const ALL_COUNTRIES = Object.values(COUNTRY_CONFIGS);

export interface LocalizationState {
  country: CountryConfig;
  language: 'en' | 'ar';
  setCountry: (code: string) => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  formatCurrency: (amount: number, opts?: { showCode?: boolean }) => string;
  formatCurrencyWithVat: (amount: number) => { base: string; vat: string; total: string };
  formatDate: (date: string | Date, style?: 'short' | 'long' | 'time') => string;
  formatPhone: (phone: string) => string;
  t: (en: string, ar: string) => string;
  isRtl: boolean;
}

const LocalizationContext = createContext<LocalizationState | null>(null);

function safeStorage(fn: () => string | null | void): string | null {
  try { return (fn() as string | null) ?? null; } catch { return null; }
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCode] = useState<string>(() =>
    safeStorage(() => localStorage.getItem('tabaq_country')) || 'SA'
  );
  const [language, setLanguageState] = useState<'en' | 'ar'>(() => {
    const stored = safeStorage(() => localStorage.getItem('tabaq_lang'));
    if (stored === 'en' || stored === 'ar') return stored;
    const country = COUNTRY_CONFIGS[safeStorage(() => localStorage.getItem('tabaq_country')) || 'SA'];
    return country?.defaultLanguage || 'ar';
  });

  const country = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS['SA'];

  const setCountry = useCallback((code: string) => {
    const cfg = COUNTRY_CONFIGS[code];
    if (!cfg) return;
    setCountryCode(code);
    safeStorage(() => { localStorage.setItem('tabaq_country', code); return null; });
    const newLang = cfg.defaultLanguage;
    setLanguageState(newLang);
    safeStorage(() => { localStorage.setItem('tabaq_lang', newLang); return null; });
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'ar') => {
    setLanguageState(lang);
    safeStorage(() => { localStorage.setItem('tabaq_lang', lang); return null; });
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const formatCurrency = useCallback((amount: number, opts?: { showCode?: boolean }): string => {
    const { code, symbolAr, decimals } = country.currency;
    const sym = language === 'ar' ? symbolAr : code;
    const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (opts?.showCode) return `${code} ${formatted}`;
    return language === 'ar' ? `${formatted} ${sym}` : `${sym} ${formatted}`;
  }, [country, language]);

  const formatCurrencyWithVat = useCallback((amount: number) => {
    const vatRate = country.vat.rate / 100;
    const vat = amount * vatRate;
    const total = amount + vat;
    return {
      base: formatCurrency(amount),
      vat: formatCurrency(vat),
      total: formatCurrency(total),
    };
  }, [country, formatCurrency]);

  const formatDate = useCallback((date: string | Date, style: 'short' | 'long' | 'time' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
    const tz = country.timezone;
    if (style === 'time') {
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: tz });
    }
    if (style === 'long') {
      return d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });
    }
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: tz });
  }, [country, language]);

  const formatPhone = useCallback((phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return `${country.phonePrefix} ${digits.slice(1)}`;
    return phone.startsWith('+') ? phone : `${country.phonePrefix} ${phone}`;
  }, [country]);

  const t = useCallback((en: string, ar: string) => language === 'ar' ? ar : en, [language]);

  const value: LocalizationState = {
    country, language, setCountry, setLanguage,
    formatCurrency, formatCurrencyWithVat, formatDate, formatPhone, t,
    isRtl: language === 'ar',
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationState {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within LocalizationProvider');
  return ctx;
}
