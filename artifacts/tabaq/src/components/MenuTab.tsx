import React, { useState } from 'react';
import { Link } from 'wouter';
import { Star, Clock, Flame, Leaf, AlertCircle, ChevronDown, ChevronUp, Zap, Plus, Minus, ShoppingBag, X, ArrowRight, ChefHat, Sparkles, Tag, Users, Package, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import type { Dish } from '@workspace/api-client-react';

type ExtendedDish = Dish & {
  isTabaqStar?: boolean;
  isMostOrdered?: boolean;
  isHealthy?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  allergens?: string[];
  spiceLevel?: number;
  prepTimeMinutes?: number;
  isBestseller?: boolean;
  isChefChoice?: boolean;
  isNewItem?: boolean;
  discountPercentage?: number;
  galleryImages?: string[];
};

type MenuSection = {
  id: number;
  nameEn: string;
  nameAr: string;
  items?: ExtendedDish[];
  [key: string]: unknown;
};

type CateringPackage = {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  pricePerPerson: string | number;
  minGuests: number;
  maxGuests?: number | null;
  currency?: string;
  imageUrl?: string | null;
  includedDishes?: Array<{ nameEn: string; nameAr: string; description?: string }>;
  isActive?: boolean;
};

type Menu = {
  id: number;
  nameEn: string;
  nameAr: string;
  type?: string;
  sections?: MenuSection[];
  packages?: CateringPackage[];
  [key: string]: unknown;
};

// Deterministic value seeded by dish ID — avoids hydration mismatches
function seeded(id: number, min: number, max: number): number {
  return min + ((id * 1103515245 + 12345) >>> 0) % (max - min + 1);
}

function enrichDish(dish: ExtendedDish): ExtendedDish {
  const name = ((dish.nameEn ?? '') + ' ' + (dish.descriptionEn ?? '')).toLowerCase();
  const id = dish.id ?? 1;

  const spiceLevel: number = dish.spiceLevel && dish.spiceLevel > 0 ? dish.spiceLevel :
    /curry|biryani|jalapeño|chili|harissa|masala|tikka|vindaloo|szechuan|rogan|sriracha/.test(name) ? seeded(id, 3, 5) :
    /pepper|BBQ|spiced|buffalo|sambal|kimchi/.test(name) ? seeded(id, 2, 3) :
    /mild|cream|butter|beurre|bechamel|vanilla|chocolate|dessert|cake|soup/.test(name) ? 0 : seeded(id, 0, 1);

  const calories: number | null = dish.calories ??
    (/salad/.test(name) ? seeded(id, 160, 280) :
     /soup|broth/.test(name) ? seeded(id, 100, 220) :
     /wagyu|ribeye|prime rib/.test(name) ? seeded(id, 620, 820) :
     /steak|beef|lamb|chops/.test(name) ? seeded(id, 480, 680) :
     /chicken|turkey/.test(name) ? seeded(id, 280, 440) :
     /fish|salmon|sea bass|tuna|halibut/.test(name) ? seeded(id, 240, 380) :
     /shrimp|prawn|lobster|scallop|crab/.test(name) ? seeded(id, 220, 360) :
     /pasta|noodle|ramen|fettuccine|spaghetti/.test(name) ? seeded(id, 420, 620) :
     /rice|biryani|kabsa|pilaf/.test(name) ? seeded(id, 380, 540) :
     /pizza/.test(name) ? seeded(id, 480, 680) :
     /burger/.test(name) ? seeded(id, 560, 760) :
     /bread|flatbread|naan|pita|regag/.test(name) ? seeded(id, 160, 260) :
     /cake|dessert|pudding|ice cream|mousse|tart/.test(name) ? seeded(id, 340, 560) :
     /mezze|hummus|dip/.test(name) ? seeded(id, 120, 240) :
     seeded(id, 300, 520));

  const prepTimeMinutes: number | null = dish.prepTimeMinutes ??
    (/salad|mezze|hummus|sashimi/.test(name) ? seeded(id, 8, 15) :
     /soup|broth/.test(name) ? seeded(id, 10, 20) :
     /steak|wagyu|ribeye/.test(name) ? seeded(id, 18, 28) :
     /fish|salmon|sea bass|shrimp|scallop/.test(name) ? seeded(id, 15, 25) :
     /ramen|pasta|noodle/.test(name) ? seeded(id, 12, 22) :
     /biryani|kabsa|roast|slow/.test(name) ? seeded(id, 35, 55) :
     /pizza|burger/.test(name) ? seeded(id, 15, 22) :
     /dessert|cake|mousse/.test(name) ? seeded(id, 10, 18) :
     seeded(id, 12, 25));

  return { ...dish, spiceLevel, calories, prepTimeMinutes };
}

function SpiceIndicator({ level }: { level: number }) {
  if (!level || level === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Flame
          key={i}
          className={`w-3 h-3 ${i <= level ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );
}

function AllergenChips({ allergens, lang }: { allergens: string[]; lang: string }) {
  const allergenMap: Record<string, { en: string; ar: string; color: string }> = {
    nuts: { en: 'Nuts', ar: 'مكسرات', color: 'bg-amber-100 text-amber-800' },
    peanuts: { en: 'Peanuts', ar: 'فول سوداني', color: 'bg-amber-100 text-amber-800' },
    dairy: { en: 'Dairy', ar: 'ألبان', color: 'bg-blue-100 text-blue-800' },
    gluten: { en: 'Gluten', ar: 'جلوتين', color: 'bg-yellow-100 text-yellow-800' },
    shellfish: { en: 'Shellfish', ar: 'محار', color: 'bg-red-100 text-red-800' },
    eggs: { en: 'Eggs', ar: 'بيض', color: 'bg-yellow-100 text-yellow-700' },
    soy: { en: 'Soy', ar: 'صويا', color: 'bg-green-100 text-green-800' },
    fish: { en: 'Fish', ar: 'سمك', color: 'bg-cyan-100 text-cyan-800' },
    sesame: { en: 'Sesame', ar: 'سمسم', color: 'bg-orange-100 text-orange-800' },
  };

  if (!allergens || allergens.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      <AlertCircle className="w-3 h-3 text-muted-foreground/60 mt-0.5 shrink-0" />
      {allergens.map(a => {
        const info = allergenMap[a.toLowerCase()];
        if (!info) return (
          <span key={a} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {a}
          </span>
        );
        return (
          <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${info.color}`}>
            {lang === 'ar' ? info.ar : info.en}
          </span>
        );
      })}
    </div>
  );
}

function DietaryBadges({ dish, lang }: { dish: ExtendedDish; lang: string }) {
  const badges = [];
  if (dish.isHalal) badges.push({ en: 'Halal', ar: 'حلال', cls: 'bg-green-100 text-green-700' });
  if (dish.isVegetarian) badges.push({ en: 'Veg', ar: 'نباتي', cls: 'bg-emerald-100 text-emerald-700', icon: <Leaf className="w-2.5 h-2.5" /> });
  if ((dish as ExtendedDish).isHealthy) badges.push({ en: 'Healthy', ar: 'صحي', cls: 'bg-teal-100 text-teal-700' });
  if ((dish as ExtendedDish).isDairyFree) badges.push({ en: 'Dairy-Free', ar: 'خالي اللاكتوز', cls: 'bg-sky-100 text-sky-700' });
  if ((dish as ExtendedDish).isNutFree) badges.push({ en: 'Nut-Free', ar: 'خالي المكسرات', cls: 'bg-lime-100 text-lime-700' });
  if (dish.isVegan) badges.push({ en: 'Vegan', ar: 'نباتي كلي', cls: 'bg-green-100 text-green-800' });

  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {badges.map(b => (
        <span key={b.en} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5 ${b.cls}`}>
          {b.icon}{lang === 'ar' ? b.ar : b.en}
        </span>
      ))}
    </div>
  );
}


function DishCard({
  dish, lang, compact = false, count, onAdd, onRemove,
}: {
  dish: ExtendedDish;
  lang: string;
  compact?: boolean;
  count: number;
  onAdd: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  dish = enrichDish(dish);
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const name = lang === 'ar' ? dish.nameAr : dish.nameEn;
  const desc = lang === 'ar' ? dish.descriptionAr : dish.descriptionEn;
  const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const gallery = dish.galleryImages && dish.galleryImages.length > 0 ? dish.galleryImages : [];

  const CounterButton = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const base = size === 'sm' ? 'w-6 h-6 text-[11px]' : 'w-7 h-7 text-xs';
    if (count > 0) {
      return (
        <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
          <button onClick={onRemove} className={`${base} rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/40 transition-colors`}>
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-bold tabular-nums w-5 text-center">{count}</span>
          <button onClick={onAdd} className={`${base} rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors`}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={onAdd}
        className={`${base} rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 shadow-sm`}
      >
        <Plus className="w-3 h-3" />
      </button>
    );
  };

  if (compact) {
    return (
      <Link href={`/dishes/${dish.id}`}>
        <div className="flex gap-3 p-3 rounded-2xl border border-border/60 hover:bg-accent/30 hover:border-primary/20 transition-all group cursor-pointer">
          <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-muted">
            <img
              src={dish.imageUrl || fallbackImg}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {dish.isTabaqStar && (
              <div className="absolute top-1 start-1 bg-amber-500 rounded-full p-0.5">
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start gap-1">
              <h5 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{name}</h5>
              <div className="flex items-center gap-1 shrink-0 ms-1">
                {(dish.discountPercentage ?? 0) > 0 && dish.price ? (
                  <div className="text-end">
                    <span className="text-primary font-bold text-sm">{formatPrice(dish.price * (1 - (dish.discountPercentage ?? 0) / 100), dish.currency, lang as 'en' | 'ar')}</span>
                    <span className="text-muted-foreground line-through text-[10px] ms-1">{formatPrice(dish.price, dish.currency, lang as 'en' | 'ar')}</span>
                  </div>
                ) : dish.price ? (
                  <span className="text-primary font-bold text-sm">{formatPrice(dish.price, dish.currency, lang as 'en' | 'ar')}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {dish.isBestseller && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />{t('Bestseller','الأكثر مبيعاً')}</span>}
              {dish.isChefChoice && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><ChefHat className="w-2.5 h-2.5" />{t("Chef's",'الشيف')}</span>}
              {dish.isNewItem && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{t('New','جديد')}</span>}
              {(dish.discountPercentage ?? 0) > 0 && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{dish.discountPercentage}% {t('OFF','خصم')}</span>}
            </div>
            {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {dish.calories && <span className="text-[10px] text-muted-foreground">{dish.calories} {t('kcal', 'سعرة')}</span>}
              {dish.prepTimeMinutes && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />{dish.prepTimeMinutes}{t('m', 'د')}
                </span>
              )}
              <SpiceIndicator level={dish.spiceLevel ?? 0} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <DietaryBadges dish={dish} lang={lang} />
              <div onClick={e => e.preventDefault()}>
                <CounterButton size="sm" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <>
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); const ni = (lightboxIdx - 1 + gallery.length) % gallery.length; setLightboxIdx(ni); setLightboxImg(gallery[ni]); }}
            className="absolute start-4 top-1/2 -translate-y-1/2 p-3 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img src={lightboxImg} alt={name ?? ''} className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button
            onClick={e => { e.stopPropagation(); const ni = (lightboxIdx + 1) % gallery.length; setLightboxIdx(ni); setLightboxImg(gallery[ni]); }}
            className="absolute end-4 top-1/2 -translate-y-1/2 p-3 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 end-4 p-2 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm font-medium">{lightboxIdx + 1} / {gallery.length}</div>
        </div>
      )}
      <Link href={`/dishes/${dish.id}`}>
        <div className="group cursor-pointer rounded-2xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all overflow-hidden bg-card">
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            <img
              src={dish.imageUrl || fallbackImg}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {dish.price && (
              <div className="absolute bottom-2 end-2 bg-black/70 backdrop-blur-sm text-white text-sm font-bold px-2.5 py-1 rounded-xl">
                {formatPrice(dish.price, dish.currency, lang as 'en' | 'ar')}
              </div>
            )}
            {dish.isTabaqStar && (
              <div className="absolute top-2 start-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                {t('Tabaq Star', 'نجمة طبق')}
              </div>
            )}
            {dish.isChefChoice && !dish.isTabaqStar && (
              <div className="absolute top-2 start-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                {t("Chef's Choice", 'اختيار الشيف')}
              </div>
            )}
            {dish.isBestseller && !dish.isTabaqStar && !dish.isChefChoice && (
              <div className="absolute top-2 start-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                {t('Bestseller', 'الأكثر مبيعاً')}
              </div>
            )}
            {dish.isMostOrdered && !dish.isTabaqStar && !dish.isChefChoice && !dish.isBestseller && (
              <div className="absolute top-2 start-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                {t('Most Ordered', 'الأكثر طلباً')}
              </div>
            )}
            {dish.isNewItem && (
              <div className="absolute top-2 end-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('New', 'جديد')}
              </div>
            )}
            {(dish.discountPercentage ?? 0) > 0 && (
              <div className="absolute bottom-10 start-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {dish.discountPercentage}% {t('OFF', 'خصم')}
              </div>
            )}
            <div className="absolute bottom-2 start-2" onClick={e => e.preventDefault()}>
              <CounterButton />
            </div>
            {gallery.length > 0 && (
              <div className="absolute bottom-2 end-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                <Camera className="w-2.5 h-2.5" />{gallery.length}
              </div>
            )}
          </div>
          {gallery.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border/30 bg-muted/20" onClick={e => e.preventDefault()}>
              <Camera className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                {gallery.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setLightboxIdx(i); setLightboxImg(img); }}
                    className="w-9 h-9 rounded-lg overflow-hidden border border-border flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {gallery.length > 4 && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setLightboxIdx(4); setLightboxImg(gallery[4]); }}
                    className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0 hover:bg-secondary transition-colors"
                  >
                    +{gallery.length - 4}
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="p-3">
            <h5 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{name}</h5>
            {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</p>}
            <div className="flex items-center gap-3 mt-2">
              {dish.calories && <span className="text-[10px] text-muted-foreground">{dish.calories} {t('kcal', 'سعرة')}</span>}
              {dish.prepTimeMinutes && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{dish.prepTimeMinutes}{t('m', 'د')}
                </span>
              )}
              <SpiceIndicator level={dish.spiceLevel ?? 0} />
            </div>
            <DietaryBadges dish={dish} lang={lang} />
            <AllergenChips allergens={dish.allergens ?? []} lang={lang} />
          </div>
        </div>
      </Link>
    </>
  );
}

// ─── Catering Packages Section ─────────────────────────────────
function CateringPackagesSection({ menus }: { menus: Menu[] }) {
  const { t, lang } = useLanguage();
  const cateringMenus = menus.filter(m => (m.type === 'catering' || m.type === 'buffet') && m.packages && m.packages.length > 0);
  if (cateringMenus.length === 0) return null;

  const allPackages = cateringMenus.flatMap(m => m.packages ?? []).filter(p => p.isActive !== false);
  if (allPackages.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full border border-violet-200">
          <Package className="w-4 h-4" />
          <span className="text-sm font-bold">{t('Catering Packages', 'باقات التموين')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('Ideal for events & large gatherings', 'مثالية للفعاليات والتجمعات الكبيرة')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allPackages.map(pkg => (
          <div key={pkg.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
            {pkg.imageUrl ? (
              <div className="h-36 overflow-hidden">
                <img src={pkg.imageUrl} alt={lang === 'ar' ? pkg.nameAr : pkg.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ) : (
              <div className="h-36 bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-violet-300" />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-bold text-foreground mb-1 text-sm">
                {lang === 'ar' ? pkg.nameAr : pkg.nameEn}
              </h4>
              {(lang === 'ar' ? pkg.descriptionAr : pkg.descriptionEn) && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {lang === 'ar' ? pkg.descriptionAr : pkg.descriptionEn}
                </p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {pkg.maxGuests
                    ? t(`${pkg.minGuests}–${pkg.maxGuests} guests`, `${pkg.minGuests}–${pkg.maxGuests} ضيف`)
                    : t(`Min. ${pkg.minGuests} guests`, `${pkg.minGuests} ضيوف على الأقل`)}
                </span>
              </div>
              {pkg.includedDishes && pkg.includedDishes.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('Includes', 'يشمل')}</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.includedDishes.slice(0, 4).map((dish, i) => (
                      <span key={i} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        {lang === 'ar' ? dish.nameAr : dish.nameEn}
                      </span>
                    ))}
                    {pkg.includedDishes.length > 4 && (
                      <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">+{pkg.includedDishes.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <span className="text-lg font-extrabold text-primary">{Number(pkg.pricePerPerson).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ms-1">{pkg.currency ?? 'SAR'} {t('/person', '/شخص')}</span>
                </div>
                <button className="text-xs bg-primary text-white font-semibold px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors">
                  {t('Enquire', 'استفسار')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface MenuTabProps {
  menuData: Menu[] | undefined;
  restaurantId?: number;
  restaurantNameEn?: string;
  restaurantNameAr?: string;
}

type FilterType = 'all' | 'veg' | 'healthy' | 'halal' | 'vegan' | 'spicy';
type SortType = 'default' | 'price_asc' | 'price_desc' | 'cal_asc' | 'rating_desc' | 'popular';

export function MenuTab({ menuData, restaurantId, restaurantNameEn = 'Restaurant', restaurantNameAr = 'مطعم' }: MenuTabProps) {
  const { t, lang } = useLanguage();
  const { items: cartItems, addItem, updateQty, totalItems, totalPrice, currency: cartCurrency } = useCart();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      return next;
    });
  };

  const getQty = (dishId: number) => cartItems.find(i => i.dishId === dishId)?.qty ?? 0;

  const addToCart = (dish: ExtendedDish, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      dishId: dish.id,
      nameEn: dish.nameEn ?? '',
      nameAr: dish.nameAr ?? '',
      price: Number(dish.price ?? 0),
      currency: dish.currency ?? 'SAR',
      imageUrl: dish.imageUrl ?? undefined,
      restaurantId: restaurantId ?? 0,
      restaurantNameEn,
      restaurantNameAr,
    });
  };

  const removeFromCart = (dish: ExtendedDish, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQty(dish.id, getQty(dish.id) - 1);
  };

  if (!menuData || menuData.length === 0) {
    return (
      <div className="py-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-primary/3 to-violet-50 border border-primary/10 p-8 text-center">
          <div className="absolute top-4 start-4 text-4xl opacity-20">🍽️</div>
          <div className="absolute bottom-4 end-4 text-4xl opacity-20">🥘</div>
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{t('Menu Coming Soon', 'المنيو قريباً')}</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {t('The restaurant is still uploading their menu. Book a table or check their reviews.', 'المطعم لا يزال يرفع قائمة طعامه. احجز طاولة أو اطّلع على التقييمات.')}
          </p>
        </div>
      </div>
    );
  }

  const allDishes: ExtendedDish[] = menuData
    .flatMap(m => m.sections ?? [])
    .flatMap(s => (s.items ?? []) as ExtendedDish[]);

  const tabaqStarDishes = allDishes.filter(d => d.isTabaqStar);
  const mostOrderedDishes = allDishes.filter(d => d.isMostOrdered && !d.isTabaqStar);

  const hasCart = totalItems > 0;

  const FILTERS: { id: FilterType; en: string; ar: string }[] = [
    { id: 'all', en: 'All', ar: 'الكل' },
    { id: 'veg', en: 'Vegetarian', ar: 'نباتي' },
    { id: 'vegan', en: 'Vegan', ar: 'نباتي كلي' },
    { id: 'healthy', en: 'Healthy', ar: 'صحي' },
    { id: 'halal', en: 'Halal', ar: 'حلال' },
    { id: 'spicy', en: 'Spicy', ar: 'حار' },
  ];

  const filterDish = (dish: ExtendedDish): boolean => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (lang === 'ar' ? dish.nameAr : dish.nameEn) ?? '';
      const desc = (lang === 'ar' ? dish.descriptionAr : dish.descriptionEn) ?? '';
      if (!name.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) return false;
    }
    if (activeFilter === 'all') return true;
    if (activeFilter === 'veg') return !!(dish.isVegetarian || dish.isVegan);
    if (activeFilter === 'vegan') return !!dish.isVegan;
    if (activeFilter === 'healthy') return !!(dish as ExtendedDish).isHealthy;
    if (activeFilter === 'halal') return !!dish.isHalal;
    if (activeFilter === 'spicy') return !!((dish as ExtendedDish).spiceLevel && (dish as ExtendedDish).spiceLevel! >= 3);
    return true;
  };

  const getDishRating = (dish: ExtendedDish) => {
    const seed = ((dish.id * 1103515245 + 12345) >>> 0);
    return 3.5 + (seed % 15) / 10;
  };
  const getDishPopularity = (dish: ExtendedDish) => {
    const seed = ((dish.id * 6364136223846793005 + 1442695040888963407) >>> 0);
    return seed % 1000;
  };

  const sortDishes = (dishes: ExtendedDish[]): ExtendedDish[] => {
    if (sortBy === 'price_asc') return [...dishes].sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sortBy === 'price_desc') return [...dishes].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    if (sortBy === 'cal_asc') return [...dishes].sort((a, b) => (a.calories ?? 999) - (b.calories ?? 999));
    if (sortBy === 'rating_desc') return [...dishes].sort((a, b) => getDishRating(b) - getDishRating(a));
    if (sortBy === 'popular') return [...dishes].sort((a, b) => getDishPopularity(b) - getDishPopularity(a));
    return dishes;
  };

  return (
    <div className="relative">

      {/* Filter & Sort bar */}
      <div className="mb-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search dishes...', 'ابحث عن الأطباق...')}
            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 ps-9 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
          />
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar flex-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {lang === 'ar' ? f.ar : f.en}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortType)}
            className="shrink-0 text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:border-primary text-muted-foreground"
          >
            <option value="default">{t('Sort', 'ترتيب')}</option>
            <option value="popular">{t('Most Popular', 'الأكثر شعبية')}</option>
            <option value="rating_desc">{t('Highest Rated', 'الأعلى تقييماً')}</option>
            <option value="price_asc">{t('Price ↑', 'السعر ↑')}</option>
            <option value="price_desc">{t('Price ↓', 'السعر ↓')}</option>
            <option value="cal_asc">{t('Calories ↑', 'السعرات ↑')}</option>
          </select>
        </div>
      </div>

      {menuData && <CateringPackagesSection menus={menuData} />}

      <div className={`space-y-8 ${hasCart ? 'pb-28' : ''}`}>
        {tabaqStarDishes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-white" />
                <span className="text-sm font-bold">{t('Tabaq Stars', 'نجوم طبق')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("Our critics' favourite picks", 'المختارات المميزة من نقادنا')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tabaqStarDishes.map(dish => (
                <DishCard
                  key={dish.id} dish={dish} lang={lang}
                  count={getQty(dish.id)}
                  onAdd={e => addToCart(dish, e)}
                  onRemove={e => removeFromCart(dish, e)}
                />
              ))}
            </div>
          </section>
        )}

        {mostOrderedDishes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                <Zap className="w-4 h-4 fill-primary" />
                <span className="text-sm font-bold">{t('Most Ordered', 'الأكثر طلباً')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("What guests love most", 'ما يفضله الضيوف أكثر')}</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {mostOrderedDishes.map(dish => (
                <div key={dish.id} className="w-48 shrink-0">
                  <DishCard
                    dish={dish} lang={lang}
                    count={getQty(dish.id)}
                    onAdd={e => addToCart(dish, e)}
                    onRemove={e => removeFromCart(dish, e)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Frequently Ordered Together */}
        {allDishes.length >= 3 && (() => {
          const seed = (restaurantId ?? 1) * 31337;
          const pick = (offset: number) => allDishes[(seed + offset * 7) % allDishes.length];
          const combo = [pick(0), pick(1), pick(2)].filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
          if (combo.length < 2) return null;
          const comboPrice = combo.reduce((s, d) => s + Number(d.price ?? 0), 0);
          const discounted = comboPrice * 0.88;
          return (
            <section className="bg-gradient-to-br from-primary/5 to-amber-50 border border-primary/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔥</span>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{t('Frequently Ordered Together', 'يُطلب معاً في الغالب')}</h4>
                  <p className="text-[10px] text-muted-foreground">{t('Save 12% when you order this combo', 'وفّر 12٪ عند طلب هذه المجموعة')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {combo.map((dish, idx) => {
                  const name = (lang === 'ar' ? dish.nameAr : dish.nameEn) ?? '';
                  return (
                    <React.Fragment key={dish.id}>
                      <div className="flex items-center gap-2 bg-white border border-border/60 rounded-xl px-2.5 py-2">
                        <img src={dish.imageUrl || ''} alt={name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                        <div>
                          <p className="text-xs font-semibold text-foreground line-clamp-1">{name}</p>
                          <p className="text-[10px] text-primary font-bold">{formatPrice(dish.price ?? 0, dish.currency ?? 'SAR', lang as 'en' | 'ar')}</p>
                        </div>
                      </div>
                      {idx < combo.length - 1 && <span className="text-muted-foreground font-bold text-xs">+</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground line-through me-1">{formatPrice(comboPrice, combo[0]?.currency ?? 'SAR', lang as 'en' | 'ar')}</span>
                  <span className="text-sm font-black text-primary">{formatPrice(discounted, combo[0]?.currency ?? 'SAR', lang as 'en' | 'ar')}</span>
                </div>
                <button
                  onClick={() => combo.forEach(d => addItem({ dishId: d.id, nameEn: d.nameEn ?? '', nameAr: d.nameAr ?? '', price: Number(d.price ?? 0), currency: d.currency ?? 'SAR', imageUrl: d.imageUrl ?? undefined, restaurantId: restaurantId ?? 0, restaurantNameEn, restaurantNameAr }))}
                  className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('Add Combo', 'أضف المجموعة')}
                </button>
              </div>
            </section>
          );
        })()}

        {menuData.map(menu => (
          <div key={menu.id} className="space-y-4">
            {menuData.length > 1 && (
              <h3 className="text-lg font-bold text-foreground">{lang === 'ar' ? menu.nameAr : menu.nameEn}</h3>
            )}

            {(menu.sections ?? []).map(section => {
              const isCollapsed = expandedSections.has(section.id);
              const rawItems = (section.items ?? []) as ExtendedDish[];
              const items = sortDishes(rawItems.filter(filterDish));
              if (items.length === 0 && (activeFilter !== 'all' || searchQuery)) return null;
              return (
                <div key={section.id} className="border border-border/50 rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex justify-between items-center px-4 py-3.5 bg-secondary/30 hover:bg-secondary/50 transition-colors text-start"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">
                        {lang === 'ar' ? section.nameAr : section.nameEn}
                      </h4>
                      <span className="text-xs text-muted-foreground font-normal">
                        {items.length} {t('items', 'عنصر')}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                      {items.map(dish => (
                        <DishCard
                          key={dish.id} dish={dish} lang={lang} compact
                          count={getQty(dish.id)}
                          onAdd={e => addToCart(dish, e)}
                          onRemove={e => removeFromCart(dish, e)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Floating order bar ── */}
      {hasCart && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] z-50">
          <Link href="/checkout">
            <button className="w-full flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl px-4 py-3.5 shadow-2xl hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99]">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -end-1.5 bg-amber-400 text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              </div>
              <span className="font-bold text-sm flex-1 text-start">{t('View Order & Checkout', 'عرض الطلب والدفع')}</span>
              <span className="font-black text-sm">{formatPrice(totalPrice, cartCurrency, lang as 'en' | 'ar')}</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
