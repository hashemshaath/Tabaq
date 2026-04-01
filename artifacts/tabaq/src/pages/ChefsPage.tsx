import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ChefHat, Award, Star, MapPin, Utensils, Filter, Search,
  ChevronRight, Globe, Flame, Sparkles, BadgeCheck, Clock, ArrowRight,
} from 'lucide-react';
import { CHEFS, type ChefData as Chef } from '@/lib/chefs';


const CUISINE_FILTERS = [
  { en: 'All Cuisines', ar: 'كل المطابخ', value: '' },
  { en: 'Modern Saudi', ar: 'سعودي حديث', value: 'saudi' },
  { en: 'Japanese', ar: 'ياباني', value: 'japanese' },
  { en: 'Italian', ar: 'إيطالي', value: 'italian' },
  { en: 'Levantine', ar: 'شامي', value: 'levantine' },
  { en: 'Fusion', ar: 'دمج', value: 'fusion' },
];

const AWARD_FILTERS = [
  { en: 'All Awards', ar: 'كل الجوائز', value: '' },
  { en: 'Michelin Starred', ar: 'نجمة ميشلان', value: 'star' },
  { en: 'Bib Gourmand', ar: 'بيب جورمان', value: 'bib' },
  { en: 'Tabaq Award', ar: 'جائزة طبق', value: 'tabaq' },
];

function MichelinStars({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">✦</span>
      ))}
    </div>
  );
}

function ChefCard({ chef, lang, t }: { chef: Chef; lang: string; t: (en: string, ar: string) => string }) {
  return (
    <Link href={`/chefs/${chef.id}`}>
      <article className="group bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="relative h-60 overflow-hidden bg-muted">
          <img
            src={chef.photo}
            alt={chef.nameEn}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Michelin / award badge */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {chef.michelinStars > 0 && (
              <span className="inline-flex items-center gap-1 bg-black/80 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-400/40 backdrop-blur">
                {Array.from({ length: chef.michelinStars }).map((_, i) => <span key={i}>✦</span>)}
                <span className="text-white ms-0.5">Michelin</span>
              </span>
            )}
            {chef.awards.some(a => a.includes('Bib')) && chef.michelinStars === 0 && (
              <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur">
                <span>🍽️</span> Bib Gourmand
              </span>
            )}
          </div>

          {/* Tabaq stars */}
          {chef.tabaqStars && (
            <div className="absolute top-3 end-3">
              <span className="bg-primary/90 backdrop-blur text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-0.5">
                {Array.from({ length: chef.tabaqStars }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
              </span>
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-3 start-3 end-3">
            <p className="text-white font-extrabold text-xl leading-tight">
              {lang === 'ar' ? chef.nameAr : chef.nameEn}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {lang === 'ar' ? chef.titleAr : chef.titleEn}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Restaurant + City */}
          <div className="flex items-start gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm truncate">
                {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{lang === 'ar' ? chef.cityAr : chef.cityEn}</span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{lang === 'ar' ? chef.nationalityAr : chef.nationalityEn}</span>
              </div>
            </div>
          </div>

          {/* Cuisine tag + years exp */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-secondary text-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {lang === 'ar' ? chef.cuisineAr : chef.cuisineEn}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {chef.yearsExp} {t('yrs', 'سنة')}
            </span>
          </div>

          {/* Short bio */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {lang === 'ar' ? chef.bioShortAr : chef.bioShortEn}
          </p>

          {/* Awards strip */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {chef.awards.slice(0, 2).map((award, i) => (
              <span key={i} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[140px]">
                {lang === 'ar' ? (chef.awardsAr[i] ?? award) : award}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('Specialty', 'التخصص')}: <span className="text-foreground font-medium">{lang === 'ar' ? chef.specialtyAr.split(' ')[0] : chef.specialtyEn.split(' ')[0]}…</span></span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Featured Chef Banner ────────────────────────────────────────────────────────

function FeaturedChef({ chef, lang, t }: { chef: Chef; lang: string; t: (en: string, ar: string) => string }) {
  const [, navigate] = useLocation();
  return (
    <div
      className="relative rounded-3xl overflow-hidden h-72 cursor-pointer group"
      onClick={() => navigate(`/chefs/${chef.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/chefs/${chef.id}`)}
    >
      <img
        src={chef.coverPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Chef photo */}
      <div className="absolute bottom-0 end-0 h-full w-72 overflow-hidden opacity-60">
        <img
          src={chef.photo}
          alt={chef.nameEn}
          className="h-full w-full object-cover object-top"
          style={{ maskImage: 'linear-gradient(to left, black 40%, transparent 100%)' }}
        />
      </div>

      <div className="absolute inset-6 flex flex-col justify-end max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            {t('Featured Chef', 'شيف مميز')}
          </span>
          <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-400/40">
            {Array.from({ length: chef.michelinStars }).map(() => '✦').join('')} Michelin
          </span>
        </div>

        <h2 className="text-white font-extrabold text-3xl leading-tight mb-1">
          {lang === 'ar' ? chef.nameAr : chef.nameEn}
        </h2>
        <p className="text-white/70 text-sm mb-2">
          {lang === 'ar' ? chef.titleAr : chef.titleEn} · {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
        </p>
        <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
          {lang === 'ar' ? chef.bioShortAr : chef.bioShortEn}
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button className="bg-white text-black font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
            {t('View Profile', 'عرض الملف')} <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="border border-white/40 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/10 transition-colors"
            onClick={e => { e.stopPropagation(); navigate(`/restaurants/${chef.restaurantId}`); }}
          >
            {t('See Restaurant', 'المطعم')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ChefsPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [awardFilter, setAwardFilter] = useState('');

  const featured = CHEFS.find(c => c.featured);

  const filtered = useMemo(() => {
    return CHEFS.filter(c => {
      if (c.featured && search === '' && cuisineFilter === '' && awardFilter === '') return true;
      const nameMatch = search === '' ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        c.nameAr.includes(search) ||
        c.restaurantEn.toLowerCase().includes(search.toLowerCase());
      const cuisineMatch = cuisineFilter === '' ||
        c.cuisineEn.toLowerCase().includes(cuisineFilter) ||
        c.cuisineAr.includes(cuisineFilter);
      const awardMatch = awardFilter === '' ||
        (awardFilter === 'star' && c.michelinStars > 0) ||
        (awardFilter === 'bib' && c.awards.some(a => a.includes('Bib'))) ||
        (awardFilter === 'tabaq' && c.awards.some(a => a.includes('Tabaq')));
      return nameMatch && cuisineMatch && awardMatch;
    });
  }, [search, cuisineFilter, awardFilter]);


  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative bg-[#0d0d0f] overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=600&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d0f]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <ChefHat className="w-4 h-4" />
            {t('TABAQ CHEF SERIES', 'سلسلة شيف طبق')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('Meet the Masters', 'تعرّف على الأساتذة')}
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
            {t(
              'The visionary chefs shaping Saudi Arabia\'s culinary identity — from Michelin-starred kitchens to beloved neighbourhood restaurants.',
              'الطهاة الحالمون الذين يشكّلون الهوية الطهوية للمملكة — من مطابخ النجوم ميشلان إلى المطاعم المحبوبة في كل حي.'
            )}
          </p>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Featured Chef */}
        {featured && <div className="mb-10"><FeaturedChef chef={featured} lang={lang} t={t} /></div>}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search chefs or restaurants…', 'ابحث عن شيف أو مطعم…')}
              className="w-full ps-9 pe-4 py-2.5 bg-card border border-border rounded-2xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Cuisine filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0">
            {CUISINE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setCuisineFilter(f.value)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  cuisineFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'ar' ? f.ar : f.en}
              </button>
            ))}
          </div>
        </div>

        {/* Award filter strip */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {AWARD_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setAwardFilter(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                awardFilter === f.value
                  ? 'bg-amber-400 text-black'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {lang === 'ar' ? f.ar : f.en}
            </button>
          ))}
          <span className="ms-auto shrink-0 text-xs text-muted-foreground self-center">
            {filtered.length} {t('chefs', 'طهاة')}
          </span>
        </div>

        {/* Chef grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <ChefHat className="w-16 h-16 text-muted-foreground/20 mx-auto mb-5" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t('No chefs match your filter', 'لا يوجد طهاة يطابقون الفلتر')}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('Try a different filter or check back as we add more chefs to our directory.', 'جرّب فلتراً مختلفاً أو تحقق لاحقاً عندما نضيف المزيد من الطهاة.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(chef => (
              <ChefCard key={chef.id} chef={chef} lang={lang} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChefsPage;
