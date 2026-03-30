import React from 'react';
import { Link } from 'wouter';
import { Star, MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import type { Experience } from '@workspace/api-client-react';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
];

function getImageForExp(id: number, images?: { url: string; isPrimary?: boolean }[]): string {
  if (images && images.length > 0) {
    const primary = images.find(i => i.isPrimary);
    return primary?.url ?? images[0].url;
  }
  return FALLBACK_IMAGES[id % FALLBACK_IMAGES.length];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  heritage: { en: 'Heritage', ar: 'التراث' },
  street_food: { en: 'Street Food', ar: 'طعام الشارع' },
  fine_dining: { en: 'Fine Dining', ar: 'مطاعم راقية' },
  live_show: { en: 'Live Show', ar: 'عروض حية' },
  cultural: { en: 'Cultural', ar: 'ثقافي' },
  cooking_class: { en: 'Cooking Class', ar: 'دروس الطبخ' },
  outdoor: { en: 'Outdoor', ar: 'في الهواء الطلق' },
  tasting: { en: 'Tasting', ar: 'تذوق' },
  brunch: { en: 'Brunch', ar: 'برانش' },
  pop_up: { en: 'Pop-Up', ar: 'مؤقت' },
};

interface ExperienceCardProps {
  experience: Experience & {
    images?: { url: string; isPrimary?: boolean }[];
    cityNameEn?: string;
    cityNameAr?: string;
    hostNameEn?: string;
    hostNameAr?: string;
  };
  layout?: 'grid' | 'list';
}

export function ExperienceCard({ experience, layout = 'grid' }: ExperienceCardProps) {
  const { lang, t } = useLanguage();
  const title = lang === 'ar' ? experience.titleAr : experience.titleEn;
  const catLabel = CATEGORY_LABELS[experience.category] ?? { en: experience.category, ar: experience.category };
  const category = lang === 'ar' ? catLabel.ar : catLabel.en;
  const expAny = experience as any;
  const city = lang === 'ar'
    ? (experience.cityNameAr ?? expAny.city ?? '')
    : (experience.cityNameEn ?? expAny.city ?? '');
  const img = getImageForExp(experience.id, experience.images);
  const duration = experience.durationMinutes ? formatDuration(experience.durationMinutes) : null;

  const price = Number(experience.pricePerPerson).toLocaleString('en-SA', {
    style: 'currency',
    currency: experience.currency || 'SAR',
    minimumFractionDigits: 0,
  });

  if (layout === 'list') {
    return (
      <Link href={`/experiences/${experience.id}`} className="block group">
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all flex gap-4 p-4">
          <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden">
            <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1.5">
                {category}
              </span>
              <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-1">{title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{city}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{duration}
                  </span>
                )}
                {experience.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{t(`Up to ${experience.capacity}`, `حتى ${experience.capacity}`)}
                  </span>
                )}
              </div>
              {experience.avgRating !== undefined && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold">{Number(experience.avgRating).toFixed(1)}</span>
                  {experience.reviewCount !== undefined && (
                    <span className="text-xs text-muted-foreground">({experience.reviewCount})</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-base font-black text-primary">{price}</span>
                <span className="text-xs text-muted-foreground ms-1">{t('/ person', '/ شخص')}</span>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                {t('Book', 'احجز')} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/experiences/${experience.id}`} className="block group">
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 end-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
            {category}
          </div>
          {duration && (
            <div className="absolute bottom-3 start-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />{duration}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-2 leading-snug">{title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
            {city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{city}
              </span>
            )}
            {experience.avgRating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{Number(experience.avgRating).toFixed(1)}</span>
                {experience.reviewCount !== undefined && (
                  <span className="text-muted-foreground">({experience.reviewCount})</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-black text-primary">{price}</span>
              <span className="text-xs text-muted-foreground ms-1">{t('/ person', '/ شخص')}</span>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary/90 transition-colors">
              {t('Book', 'احجز')} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
