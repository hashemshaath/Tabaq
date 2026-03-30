import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { MICHELIN_RESTAURANTS, BIB_GOURMAND } from '@/data/michelin';
import { Star, MapPin, ChefHat, Award, ArrowRight, Filter, Utensils } from 'lucide-react';

function StarRow({ count }: { count: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

function MichelinStarIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <svg viewBox="0 0 24 24" fill="none" className={sz} style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#e23744" />
      <path d="M12 5l1.5 4.5H18l-3.75 2.75L15.75 17 12 14.25 8.25 17l1.5-4.75L6 9.5h4.5z" fill="white" />
    </svg>
  );
}

const CITIES = ['All', 'Riyadh', 'Jeddah', 'Dammam'];

export function MichelinPage() {
  const { t, lang } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('All');

  usePageMeta({
    titleEn: 'Michelin Guide Saudi Arabia — Starred Restaurants',
    titleAr: 'دليل ميشلان المملكة العربية السعودية — المطاعم المرصعة بالنجوم',
    descriptionEn: 'Discover Michelin Star restaurants across Saudi Arabia. From one-star rising talents to legendary fine dining experiences.',
    descriptionAr: 'اكتشف مطاعم نجوم ميشلان في جميع أنحاء المملكة العربية السعودية.',
    keywords: 'michelin star, saudi arabia, fine dining, luxury restaurant, riyadh, jeddah',
  }, lang);

  const filtered = MICHELIN_RESTAURANTS.filter(r =>
    selectedCity === 'All' || r.cityEn === selectedCity
  );

  return (
    <div className="min-h-screen bg-[#0d0d0f]">

      {/* ── HERO ── */}
      <div className="relative h-[60vh] min-h-[480px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop"
          alt="Fine dining"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.35) saturate(0.8)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/40 to-transparent" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          {/* Michelin logo mark */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-px h-12 bg-amber-400/40" />
            <MichelinStarIcon size="lg" />
            <div className="w-px h-12 bg-amber-400/40" />
          </div>

          <p className="text-amber-400 text-sm font-semibold tracking-[0.25em] uppercase mb-3">
            {t('Michelin Guide Saudi Arabia', 'دليل ميشلان المملكة العربية السعودية')}
          </p>
          <h1 className="text-white text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {t('The Starred', 'المطاعم')}
            <span className="block text-amber-400">{t('Restaurants', 'المرصعة بالنجوم')}</span>
          </h1>
          <p className="text-white/60 text-base max-w-xl leading-relaxed">
            {t(
              'A curated guide to Saudi Arabia\'s finest culinary experiences, recognized by the world\'s most prestigious dining authority.',
              'دليل منتقى لأرقى التجارب الطهوية في المملكة العربية السعودية، معترف بها من قِبَل أكثر سلطات تناول الطعام مكانةً في العالم.'
            )}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-8 text-white">
            {[
              { val: '6', label: t('Starred Restaurants', 'مطعم نجمة'), icon: '⭐' },
              { val: '2', label: t('Bib Gourmand', 'بيب جورمان'), icon: '😊' },
              { val: '3', label: t('Cities', 'مدن'), icon: '🏙️' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-400">{s.val}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INTRO BAND ── */}
      <div className="bg-[#1a1008] border-y border-amber-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-amber-200/70">
            <MichelinStarIcon size="sm" />
            <span>{t('One Star: A very good restaurant in its category', 'نجمة واحدة: مطعم جيد جداً في فئته')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span className="text-base">😊</span>
            <span>{t('Bib Gourmand: Exceptional value for money', 'بيب جورمان: قيمة استثنائية مقابل المال')}</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-white text-2xl font-bold">{t('Starred Restaurants', 'المطاعم المرصعة بالنجوم')}</h2>
            <p className="text-white/40 text-sm mt-1">{filtered.length} {t('restaurants', 'مطعم')}</p>
          </div>
          <div className="flex items-center gap-2">
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCity === city
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/12'
                }`}
              >
                {city === 'All' ? t('All', 'الكل') : city}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant cards grid */}
        <div className="space-y-6">
          {filtered.map((r) => (
            <Link key={r.id} href={`/michelin/${r.id}`} className="group block">
              <div className="flex flex-col md:flex-row bg-[#17150f] border border-amber-900/25 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.08)]">

                {/* Image */}
                <div className="md:w-72 lg:w-80 relative overflow-hidden shrink-0 h-52 md:h-auto">
                  <img
                    src={r.coverImage}
                    alt={r.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ filter: 'brightness(0.8) saturate(0.85)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#17150f]/60 hidden md:block" />

                  {/* Star badge */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-amber-400/30 rounded-lg px-2.5 py-1.5">
                    <MichelinStarIcon size="sm" />
                    <span className="text-amber-400 text-xs font-bold">
                      {r.stars} {r.stars === 1 ? t('Star', 'نجمة') : t('Stars', 'نجوم')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-white text-xl font-bold group-hover:text-amber-400 transition-colors">
                          {lang === 'ar' ? r.nameAr : r.nameEn}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <StarRow count={r.stars} />
                          <span className="text-amber-500/70 text-sm font-medium">{lang === 'ar' ? r.cuisineAr : r.cuisineEn}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40 text-sm shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                        {lang === 'ar' ? r.cityAr : r.cityEn}
                      </div>
                    </div>

                    <p className="text-white/55 text-sm leading-relaxed line-clamp-2 mb-4">
                      {lang === 'ar' ? r.descriptionAr : r.descriptionEn}
                    </p>

                    {/* Signature dishes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/30 text-xs">{t('Signature:', 'مميز:')}</span>
                      {r.signatureDishes.slice(0, 2).map(d => (
                        <span key={d.nameEn} className="text-xs bg-white/8 text-white/50 px-2.5 py-1 rounded-full border border-white/10">
                          {lang === 'ar' ? d.nameAr : d.nameEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/8">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-amber-500/70" />
                      <span className="text-white/50 text-sm">{lang === 'ar' ? r.chefAr : r.chefEn}</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
                      {t('View Restaurant', 'عرض المطعم')}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bib Gourmand Section */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-3xl">😊</div>
            <div>
              <h2 className="text-white text-2xl font-bold">{t('Bib Gourmand', 'بيب جورمان')}</h2>
              <p className="text-white/40 text-sm">{t('Exceptional value for money', 'قيمة استثنائية مقابل المال')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BIB_GOURMAND.map(r => (
              <div key={r.id} className="bg-[#17150f] border border-amber-900/20 rounded-xl p-5 flex items-center gap-4 hover:border-amber-800/40 transition-colors">
                <img
                  src={r.coverImage}
                  alt={r.nameEn}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                  style={{ filter: 'brightness(0.8)' }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">😊</span>
                    <h3 className="text-white font-semibold">{lang === 'ar' ? r.nameAr : r.nameEn}</h3>
                  </div>
                  <p className="text-white/45 text-xs line-clamp-2 mb-2">{lang === 'ar' ? r.descriptionAr : r.descriptionEn}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500/70 text-xs">{lang === 'ar' ? r.cuisineAr : r.cuisineEn}</span>
                    <span className="text-white/30 text-xs">·</span>
                    <span className="text-white/40 text-xs">{lang === 'ar' ? r.cityAr : r.cityEn}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Michelin */}
        <div className="mt-16 bg-[#17150f] border border-amber-900/20 rounded-xl p-8 text-center">
          <MichelinStarIcon size="lg" />
          <h3 className="text-white text-xl font-bold mt-4 mb-3">{t('About the Michelin Guide', 'عن دليل ميشلان')}</h3>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto">
            {t(
              'The Michelin Guide has been a reference in the restaurant world since 1900. Inspectors visit restaurants anonymously and rate them using the iconic star system. One star signifies "a very good restaurant." Saudi Arabia joined the guide in 2024, celebrating the Kingdom\'s diverse and extraordinary culinary scene.',
              'يُعدّ دليل ميشلان مرجعاً في عالم المطاعم منذ عام 1900. يزور المفتشون المطاعم بشكل مجهول ويقيّمونها باستخدام نظام النجوم الأيقوني. تعني نجمة واحدة "مطعم جيد جداً". انضمت المملكة العربية السعودية إلى الدليل عام 2024.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
