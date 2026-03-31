export type AwardBadge = {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  bgClass: string;
  textClass: string;
};

export function getRestaurantAwards(restaurant: {
  avgRating?: number | string | null;
  reviewCount?: number | string | null;
  priceTier?: string | null;
  isVerified?: boolean | null;
}): AwardBadge[] {
  const rating = Number(restaurant.avgRating ?? 0);
  const reviews = Number(restaurant.reviewCount ?? 0);
  const tier = restaurant.priceTier;
  const badges: AwardBadge[] = [];

  if (rating >= 4.8 && reviews >= 30) {
    badges.push({
      id: 'excellence',
      labelEn: 'Award of Excellence',
      labelAr: 'جائزة التميز',
      icon: '🌟',
      bgClass: 'bg-amber-500',
      textClass: 'text-white',
    });
  } else if (rating >= 4.5 && reviews >= 15) {
    badges.push({
      id: 'top-rated',
      labelEn: 'Top Rated',
      labelAr: 'الأعلى تقييماً',
      icon: '⭐',
      bgClass: 'bg-yellow-400',
      textClass: 'text-yellow-900',
    });
  }

  if (tier === 'fine_dining' && rating >= 4.0) {
    badges.push({
      id: 'fine-dining',
      labelEn: 'Fine Dining',
      labelAr: 'مطعم راقٍ',
      icon: '🍽️',
      bgClass: 'bg-gray-900',
      textClass: 'text-white',
    });
  }

  if (reviews > 0 && reviews <= 8 && rating >= 4.2) {
    badges.push({
      id: 'hidden-gem',
      labelEn: 'Hidden Gem',
      labelAr: 'جوهرة خفية',
      icon: '💎',
      bgClass: 'bg-gray-700',
      textClass: 'text-white',
    });
  }

  return badges.slice(0, 2);
}

export const COLLECTIONS = [
  {
    id: 'top-rated',
    slug: 'top-rated',
    labelEn: 'Top Rated',
    labelAr: 'الأعلى تقييماً',
    descEn: 'The highest-rated restaurants, chosen by thousands of diners.',
    descAr: 'أعلى المطاعم تقييماً، اختارها آلاف رواد الطعام.',
    icon: '⭐',
    gradient: 'from-amber-900 to-yellow-950',
    params: { minRating: 4.5, limit: 12 },
  },
  {
    id: 'fine-dining',
    slug: 'fine-dining',
    labelEn: 'Fine Dining',
    labelAr: 'الطعام الراقي',
    descEn: 'Exceptional fine-dining experiences for special occasions.',
    descAr: 'تجارب طعام راقية استثنائية للمناسبات الخاصة.',
    icon: '🍽️',
    gradient: 'from-gray-900 to-black',
    params: { priceTier: 'fine_dining', limit: 12 },
  },
  {
    id: 'date-night',
    slug: 'date-night',
    labelEn: 'Date Night',
    labelAr: 'ليلة رومانسية',
    descEn: 'Perfect romantic settings for an unforgettable evening.',
    descAr: 'الأجواء الرومانسية المثالية لأمسية لا تُنسى.',
    icon: '🌹',
    gradient: 'from-red-900 to-rose-950',
    params: { occasionId: 3, limit: 12 },
  },
  {
    id: 'family',
    slug: 'family',
    labelEn: 'Family Friendly',
    labelAr: 'مناسب للعائلات',
    descEn: 'Great spots welcoming the whole family for a memorable meal.',
    descAr: 'أماكن رائعة تستقبل العائلة بالكامل لوجبة لا تُنسى.',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-gray-800 to-gray-950',
    params: { occasionId: 1, limit: 12 },
  },
  {
    id: 'hidden-gems',
    slug: 'hidden-gems',
    labelEn: 'Hidden Gems',
    labelAr: 'الجواهر الخفية',
    descEn: 'Undiscovered local favorites worth seeking out.',
    descAr: 'المفضلات المحلية غير المكتشفة التي تستحق البحث عنها.',
    icon: '💎',
    gradient: 'from-gray-900 to-slate-950',
    params: { minRating: 4.0, limit: 12 },
  },
  {
    id: 'budget-picks',
    slug: 'budget-picks',
    labelEn: 'Budget Picks',
    labelAr: 'خيارات اقتصادية',
    descEn: 'Delicious food that\'s easy on the wallet.',
    descAr: 'طعام لذيذ لا يُثقل الميزانية.',
    icon: '💰',
    gradient: 'from-gray-700 to-gray-900',
    params: { priceTier: 'budget', limit: 12 },
  },
  {
    id: 'business-dining',
    slug: 'business-dining',
    labelEn: 'Business Dining',
    labelAr: 'غداء عمل',
    descEn: 'Sophisticated venues ideal for business lunches and meetings.',
    descAr: 'أماكن راقية مثالية لغداء العمل والاجتماعات.',
    icon: '💼',
    gradient: 'from-slate-800 to-slate-950',
    params: { occasionId: 2, limit: 12 },
  },
  {
    id: 'new-openings',
    slug: 'new-openings',
    labelEn: 'New Openings',
    labelAr: 'افتتاحات جديدة',
    descEn: 'Fresh new restaurants to discover this season.',
    descAr: 'مطاعم جديدة رائعة لاكتشافها هذا الموسم.',
    icon: '🆕',
    gradient: 'from-red-800 to-red-950',
    params: { sortBy: 'newest', limit: 12 },
  },
] as const;
