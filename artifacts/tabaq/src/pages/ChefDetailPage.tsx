import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import {
  ChefHat, Award, Star, MapPin, Utensils, Globe, Clock, ArrowLeft,
  Quote, ExternalLink, Heart, Share2, ChevronRight, Sparkles,
  BookOpen, CalendarDays, Users, Flame, BadgeCheck, Trophy,
  Play, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  year: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
}

interface SignatureDish {
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  image: string;
  price: string;
  restaurantId: number;
}

interface ChefEvent {
  dateEn: string;
  dateAr: string;
  titleEn: string;
  titleAr: string;
  venueEn: string;
  venueAr: string;
  type: 'class' | 'dinner' | 'tasting' | 'masterclass';
}

interface ChefDetail {
  id: number;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  nationalityEn: string;
  nationalityAr: string;
  restaurantEn: string;
  restaurantAr: string;
  restaurantId: number;
  cityEn: string;
  cityAr: string;
  cuisineEn: string;
  cuisineAr: string;
  photo: string;
  coverPhoto: string;
  coverPhoto2?: string;
  michelinStars: number;
  awards: string[];
  awardsAr: string[];
  bioEn: string;
  bioAr: string;
  philosophyEn: string;
  philosophyAr: string;
  quoteEn: string;
  quoteAr: string;
  specialtyEn: string;
  specialtyAr: string;
  yearsExp: number;
  tabaqStars?: number;
  instagram?: string;
  timeline: TimelineEntry[];
  signatureDishes: SignatureDish[];
  upcomingEvents: ChefEvent[];
  recommendedRestaurantsEn: string[];
  recommendedRestaurantsAr: string[];
  recommendedRestaurantIds: number[];
}

// ── Chef Data (populated from API when available) ──────────────────────────────

const CHEF_DETAILS: Record<number, ChefDetail> = {};



// ── Event type config ──────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  dinner: { labelEn: 'Chef\'s Table', labelAr: 'طاولة الشيف', color: 'bg-primary/10 text-primary border-primary/20' },
  masterclass: { labelEn: 'Masterclass', labelAr: 'ماسترکلاس', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  tasting: { labelEn: 'Tasting', labelAr: 'تذوق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  class: { labelEn: 'Class', labelAr: 'دورة', color: 'bg-green-50 text-green-700 border-green-200' },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export function ChefDetailPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? '1');

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'dishes' | 'timeline' | 'events'>('story');

  const chef = CHEF_DETAILS[id];

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('Chef not found', 'الشيف غير موجود')}</h2>
          <Link href="/chefs"><Button variant="outline" className="rounded-2xl mt-2">{t('Back to Chefs', 'العودة للطهاة')}</Button></Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'story' as const, labelEn: 'Story', labelAr: 'القصة' },
    { id: 'dishes' as const, labelEn: 'Signature Dishes', labelAr: 'الأطباق المميزة' },
    { id: 'timeline' as const, labelEn: 'Career', labelAr: 'المسيرة' },
    { id: 'events' as const, labelEn: 'Events', labelAr: 'الأحداث' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative h-[420px] sm:h-[500px] overflow-hidden bg-[#0d0d0f]">
        <img
          src={chef.coverPhoto}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 start-6">
          <Link href="/chefs">
            <button className="flex items-center gap-2 text-white/80 hover:text-white bg-black/30 backdrop-blur border border-white/20 px-4 py-2 rounded-2xl text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : undefined }} />
              {t('All Chefs', 'جميع الطهاة')}
            </button>
          </Link>
        </div>

        {/* Action buttons */}
        <div className="absolute top-6 end-6 flex gap-2">
          <button
            onClick={() => setSaved(s => !s)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border backdrop-blur transition-all ${
              saved ? 'bg-red-500/20 border-red-400/40 text-red-400' : 'bg-black/30 border-white/20 text-white/80 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-black/30 border-white/20 text-white/80 hover:text-white backdrop-blur transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chef info overlay */}
        <div className="absolute bottom-0 start-0 end-0 p-6 sm:p-10 flex flex-col sm:flex-row items-end sm:items-end gap-6">
          {/* Chef photo */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-muted">
              <img src={chef.photo} alt={chef.nameEn} className="w-full h-full object-cover object-top" />
            </div>
            {chef.michelinStars > 0 && (
              <div className="absolute -top-2 -end-2 bg-amber-400 text-black text-xs font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-background shadow">
                {chef.michelinStars === 1 ? '✦' : '✦✦'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Awards badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {chef.michelinStars > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40">
                  {Array.from({ length: chef.michelinStars }).map(() => '✦').join('')} Michelin
                </span>
              )}
              {chef.awards.some(a => a.includes('Bib')) && chef.michelinStars === 0 && (
                <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 text-xs font-bold px-3 py-1 rounded-full border border-red-400/40">
                  🍽️ Bib Gourmand
                </span>
              )}
              {chef.tabaqStars && (
                <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                  {Array.from({ length: chef.tabaqStars }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
                  Tabaq
                </span>
              )}
            </div>

            <h1 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight mb-1">
              {lang === 'ar' ? chef.nameAr : chef.nameEn}
            </h1>
            <p className="text-white/70 text-sm sm:text-base mb-2">
              {lang === 'ar' ? chef.titleAr : chef.titleEn}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm">
              <span className="flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" />
                <Link href={`/restaurants/${chef.restaurantId}`} className="hover:text-white transition-colors">
                  {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {lang === 'ar' ? chef.cityAr : chef.cityEn}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {lang === 'ar' ? chef.nationalityAr : chef.nationalityEn}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {chef.yearsExp} {t('years', 'سنة')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── Story Tab ── */}
            {activeTab === 'story' && (
              <>
                {/* Quote */}
                <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/15 rounded-3xl p-6">
                  <Quote className="w-8 h-8 text-primary/30 mb-3" />
                  <blockquote className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed italic">
                    {lang === 'ar' ? chef.quoteAr : chef.quoteEn}
                  </blockquote>
                </div>

                {/* Biography */}
                <div>
                  <h2 className="text-xl font-extrabold text-foreground mb-4">{t('Biography', 'السيرة الذاتية')}</h2>
                  <div className="space-y-4">
                    {(lang === 'ar' ? chef.bioAr : chef.bioEn).split('\n\n').map((para, i) => (
                      <p key={i} className="text-muted-foreground leading-relaxed text-[15px]">{para}</p>
                    ))}
                  </div>
                </div>

                {/* Philosophy */}
                <div className="bg-secondary/60 rounded-3xl p-6 border border-border/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">{t('Culinary Philosophy', 'الفلسفة الطهوية')}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {lang === 'ar' ? chef.philosophyAr : chef.philosophyEn}
                  </p>
                </div>

                {/* Specialty */}
                <div className="flex items-start gap-4 bg-card border border-border/60 rounded-3xl p-5">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-1">{t('Specialty', 'التخصص')}</p>
                    <p className="text-muted-foreground text-sm">
                      {lang === 'ar' ? chef.specialtyAr : chef.specialtyEn}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── Dishes Tab ── */}
            {activeTab === 'dishes' && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold text-foreground">{t('Signature Dishes', 'الأطباق المميزة')}</h2>
                {chef.signatureDishes.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <Utensils className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                    <p className="font-bold text-foreground mb-1">{t('No signature dishes listed yet', 'لا توجد أطباق مميزة مدرجة بعد')}</p>
                    <p className="text-muted-foreground text-sm mb-6">{t("Visit the chef's restaurant to explore the full menu.", 'قم بزيارة مطعم الشيف لاستعراض القائمة الكاملة.')}</p>
                    {chef.restaurantId && (
                      <Link href={`/restaurants/${chef.restaurantId}`}>
                        <button className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                          {t('View Restaurant Menu', 'عرض قائمة المطعم')}
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  chef.signatureDishes.map((dish, i) => (
                    <Link key={i} href={`/restaurants/${dish.restaurantId}`}>
                      <article className="group bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row">
                        <div className="sm:w-52 h-44 sm:h-auto overflow-hidden shrink-0 bg-muted">
                          <img
                            src={dish.image}
                            alt={dish.nameEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-5 flex flex-col justify-between flex-1">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-extrabold text-foreground text-lg leading-snug">
                                {lang === 'ar' ? dish.nameAr : dish.nameEn}
                              </h3>
                              <span className="shrink-0 bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-xl">
                                {dish.price}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                              {lang === 'ar' ? dish.descAr : dish.descEn}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-4 text-xs text-primary font-semibold">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {t('View at restaurant', 'عرض في المطعم')}
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* ── Timeline Tab ── */}
            {activeTab === 'timeline' && (
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-6">{t('Career Timeline', 'المسيرة المهنية')}</h2>
                {chef.timeline.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                    <p className="font-bold text-foreground mb-1">{t('Career history not available', 'السيرة المهنية غير متاحة')}</p>
                    <p className="text-muted-foreground text-sm">{t("This chef's career milestones haven't been added yet.", 'لم يتم إضافة مراحل المسيرة المهنية لهذا الشيف بعد.')}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute start-[22px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-8">
                      {chef.timeline.map((entry, i) => {
                        const Icon = entry.icon;
                        return (
                          <div key={i} className="flex gap-5 relative">
                            <div className="relative z-10 w-11 h-11 bg-card border-2 border-primary/30 rounded-2xl flex items-center justify-center shrink-0 shadow">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 bg-card border border-border/60 rounded-3xl p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="bg-primary text-white text-xs font-black px-2.5 py-0.5 rounded-full">{entry.year}</span>
                                <h3 className="font-bold text-foreground text-sm">
                                  {lang === 'ar' ? entry.titleAr : entry.titleEn}
                                </h3>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {lang === 'ar' ? entry.descAr : entry.descEn}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Events Tab ── */}
            {activeTab === 'events' && (
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-6">{t('Upcoming Events', 'الأحداث القادمة')}</h2>
                {chef.upcomingEvents.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
                    <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('No upcoming events.', 'لا توجد أحداث قادمة.')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chef.upcomingEvents.map((event, i) => {
                      const cfg = EVENT_CONFIG[event.type];
                      return (
                        <div key={i} className="bg-card border border-border/60 rounded-3xl p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                              <CalendarDays className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                                  {lang === 'ar' ? cfg.labelAr : cfg.labelEn}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {lang === 'ar' ? event.dateAr : event.dateEn}
                                </span>
                              </div>
                              <h3 className="font-bold text-foreground mb-1">
                                {lang === 'ar' ? event.titleAr : event.titleEn}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {lang === 'ar' ? event.venueAr : event.venueEn}
                              </p>
                            </div>
                            <Link href="/bookings">
                              <Button size="sm" className="rounded-xl shrink-0">
                                {t('Book', 'احجز')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Restaurant card */}
            <Link href={`/restaurants/${chef.restaurantId}`}>
              <div className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-32 bg-muted overflow-hidden">
                  <img
                    src={chef.coverPhoto}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('Current Restaurant', 'المطعم الحالي')}</p>
                  <p className="font-extrabold text-foreground mb-0.5">
                    {lang === 'ar' ? chef.restaurantAr : chef.restaurantEn}
                  </p>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3" />
                    {lang === 'ar' ? chef.cityAr : chef.cityEn}
                  </div>
                  <button className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-2xl text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    {t('View Restaurant', 'عرض المطعم')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>

            {/* Awards */}
            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-foreground text-sm">{t('Awards & Recognition', 'الجوائز والتكريم')}</h3>
              </div>
              <div className="space-y-2.5">
                {chef.awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center shrink-0">
                      <Award className="w-3 h-3 text-amber-500" />
                    </div>
                    <p className="text-sm text-foreground">
                      {lang === 'ar' ? (chef.awardsAr[i] ?? award) : award}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-card border border-border/60 rounded-3xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4">{t('Quick Facts', 'حقائق سريعة')}</h3>
              <div className="space-y-3">
                {[
                  { icon: Globe, labelEn: 'Nationality', labelAr: 'الجنسية', valueEn: chef.nationalityEn, valueAr: chef.nationalityAr },
                  { icon: Utensils, labelEn: 'Cuisine', labelAr: 'المطبخ', valueEn: chef.cuisineEn, valueAr: chef.cuisineAr },
                  { icon: Clock, labelEn: 'Experience', labelAr: 'الخبرة', valueEn: `${chef.yearsExp} years`, valueAr: `${chef.yearsExp} سنة` },
                  { icon: MapPin, labelEn: 'Based in', labelAr: 'مقيم في', valueEn: chef.cityEn, valueAr: chef.cityAr },
                ].map((fact, i) => {
                  const Icon = fact.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{lang === 'ar' ? fact.labelAr : fact.labelEn}</span>
                      <span className="text-xs font-semibold text-foreground">{lang === 'ar' ? fact.valueAr : fact.valueEn}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chef's recommendations */}
            {chef.recommendedRestaurantsEn.length > 0 && (
              <div className="bg-card border border-border/60 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-sm">{t("Chef's Picks", 'اختيارات الشيف')}</h3>
                </div>
                <div className="space-y-2.5">
                  {chef.recommendedRestaurantsEn.map((name, i) => (
                    <Link key={i} href={`/restaurants/${chef.recommendedRestaurantIds[i]}`}>
                      <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-2 transition-colors">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-primary">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {lang === 'ar' ? chef.recommendedRestaurantsAr[i] : name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ms-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to chefs */}
            <Link href="/chefs">
              <button className="w-full border border-border text-muted-foreground font-semibold py-2.5 rounded-2xl text-sm hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2">
                <ChefHat className="w-4 h-4" />
                {t('All Chefs', 'جميع الطهاة')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChefDetailPage;
