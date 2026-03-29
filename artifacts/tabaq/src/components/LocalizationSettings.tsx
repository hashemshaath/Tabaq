import React, { useState } from 'react';
import { useLocalization, COUNTRY_CONFIGS, ALL_COUNTRIES, CountryConfig } from '@/context/LocalizationContext';
import {
  Globe, Clock, DollarSign, Percent, Languages, ChevronDown, Check, Search, X
} from 'lucide-react';

function CountryPickerModal({ onClose }: { onClose: () => void }) {
  const { t, language, setCountry, country } = useLocalization();
  const [query, setQuery] = useState('');

  const filtered = ALL_COUNTRIES.filter(c =>
    c.nameEn.toLowerCase().includes(query.toLowerCase()) ||
    c.nameAr.includes(query) ||
    c.code.toLowerCase().includes(query.toLowerCase())
  );

  const grouped: Record<string, CountryConfig[]> = {
    GCC: filtered.filter(c => ['SA', 'AE', 'KW', 'BH', 'QA', 'OM'].includes(c.code)),
    'Middle East': filtered.filter(c => ['EG', 'JO'].includes(c.code)),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-border/50">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold text-foreground">{t('Select Country', 'اختر الدولة')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Settings auto-apply based on country', 'تُطبَّق الإعدادات تلقائياً حسب الدولة')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border/40">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t('Search countries...', 'البحث عن الدول...')}
              className="w-full ps-9 pe-4 py-2.5 text-sm bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 py-2">
          {Object.entries(grouped).map(([group, countries]) => {
            if (countries.length === 0) return null;
            return (
              <div key={group}>
                <p className="px-5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">{group}</p>
                {countries.map(c => {
                  const isSelected = c.code === country.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); onClose(); }}
                      className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <div className="flex-1 text-start">
                        <p className="text-sm font-semibold text-foreground">
                          {language === 'ar' ? c.nameAr : c.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.currency.code} · {c.timezone.split('/')[1]?.replace(/_/g, ' ')} · {c.phonePrefix}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">{t('No countries found', 'لا توجد دول مطابقة')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LocalizationSettings() {
  const { t, language, setLanguage, country, formatCurrency, formatDate } = useLocalization();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const infoCards = [
    {
      icon: Clock, label: t('Timezone', 'المنطقة الزمنية'), labelAr: 'المنطقة الزمنية',
      value: country.timezoneLabel,
      sub: formatDate(new Date(), 'time') + ' ' + t('now', 'الآن'),
    },
    {
      icon: DollarSign, label: t('Currency', 'العملة'), labelAr: 'العملة',
      value: `${country.currency.code} (${language === 'ar' ? country.currency.symbolAr : country.currency.symbol})`,
      sub: `${formatCurrency(1000)} = 1,000 ${country.currency.code}`,
    },
    {
      icon: Percent, label: t('Tax / VAT', 'الضريبة'), labelAr: 'الضريبة',
      value: country.vat.rate > 0 ? `${country.vat.rate}% ${language === 'ar' ? country.vat.labelAr : country.vat.label}` : t('No VAT', 'لا ضريبة'),
      sub: country.vat.rate > 0
        ? `${t('On', 'على')} ${formatCurrency(100)}: ${t('tax', 'ضريبة')} ${formatCurrency(country.vat.rate)}`
        : t('Tax-free country', 'دولة معفاة من الضريبة'),
    },
    {
      icon: Languages, label: t('Language', 'اللغة'), labelAr: 'اللغة',
      value: language === 'ar' ? 'العربية' : 'English',
      sub: country.languages.map(l => l === 'ar' ? 'العربية' : 'English').join(' · '),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-foreground mb-1">{t('Localization & Region', 'اللغة والمنطقة')}</h3>
        <p className="text-xs text-muted-foreground">{t('All settings auto-apply based on your selected country', 'تُطبَّق جميع الإعدادات تلقائياً حسب دولتك المختارة')}</p>
      </div>

      <button
        onClick={() => setShowCountryPicker(true)}
        className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all"
      >
        <span className="text-3xl">{country.flag}</span>
        <div className="flex-1 text-start">
          <p className="text-sm font-bold text-foreground">
            {language === 'ar' ? country.nameAr : country.nameEn}
          </p>
          <p className="text-xs text-muted-foreground">{country.phonePrefix} · {country.currency.code}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
          <Globe className="w-3.5 h-3.5" />
          {t('Change', 'تغيير')}
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        {infoCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-snug">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('Interface Language', 'لغة الواجهة')}</p>
        <div className="flex gap-2">
          {country.languages.map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${language === lang ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
            >
              {lang === 'ar' ? 'العربية' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {country.nationalAddressEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🇸🇦</span>
          <div>
            <p className="text-sm font-bold text-amber-800">{t('Saudi National Address System', 'نظام العنوان الوطني السعودي')}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t('Your addresses support Building No., Additional No., and National Address Code (e.g. RRCA 2457) as per Saudi Post standards.',
                 'تدعم عناوينك رقم المبنى والرقم الإضافي ورمز العنوان الوطني (مثل RRCA 2457) وفق معايير البريد السعودي.')}
            </p>
          </div>
        </div>
      )}

      {showCountryPicker && <CountryPickerModal onClose={() => setShowCountryPicker(false)} />}
    </div>
  );
}
