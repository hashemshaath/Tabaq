import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers, usePurchaseVoucher, useGiftVoucher, type Offer } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Tag, Clock, CheckCircle2, Gift, Users, Copy, MapPin, Star,
  Search, Filter, Percent, ChevronRight, Flame, Sparkles,
  ScanLine, QrCode, Info, ChevronDown, ChevronUp, Share2,
  Bookmark, ArrowRight, X, Zap, Shield, RotateCcw, Utensils
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

// ─── Mock offers to augment API data ──────────────────────────────
const MOCK_OFFERS = [
  {
    id: 9001,
    titleEn: '50% Off Premium Dining Set Menu for Two',
    titleAr: 'خصم 50٪ على قائمة الطعام المميزة لشخصين',
    descriptionEn: 'Indulge in a 4-course set menu for two at Najd Village — Saudi Arabia\'s most celebrated traditional restaurant. Includes welcome mezze, signature mains, dessert platter, and soft drinks.',
    descriptionAr: 'استمتع بقائمة طعام مكونة من 4 أطباق لشخصين في قرية نجد — أشهر مطعم تقليدي في المملكة.',
    restaurantId: 1, restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    discountPercent: '50', originalPrice: '380', discountedPrice: '190', currency: 'SAR',
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 18, categoryEn: 'Fine Dining', city: 'Riyadh', rating: 4.8, reviews: 342,
    highlights: ['4-Course Set Menu', 'Welcome Mezze Included', 'Valid Sun–Thu', 'Table by Window Available'],
    termsEn: 'Valid for 2 guests only. Advance booking required 24 hours before. Not valid with any other offer. Non-refundable once purchased. Valid 7 days from purchase date.',
  },
  {
    id: 9002,
    titleEn: '40% Off Omakase Dinner Experience',
    titleAr: 'خصم 40٪ على تجربة عشاء أوماكاسي',
    descriptionEn: 'Experience the finest Japanese Omakase at Sushi Sama. The chef curates 12 seasonal courses using the freshest daily imported fish. A truly unmissable culinary journey.',
    descriptionAr: 'اختبر أرقى الأوماكاسي الياباني في سوشي ساما. يختار الشيف 12 طبقاً موسمياً يومياً.',
    restaurantId: 3, restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop',
    discountPercent: '40', originalPrice: '650', discountedPrice: '390', currency: 'SAR',
    validUntil: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 6, categoryEn: 'Japanese', city: 'Riyadh', rating: 4.9, reviews: 187,
    highlights: ['12 Seasonal Courses', 'Chef\'s Selection Daily', 'Sake Pairing Add-on Available', 'Private Counter Seating'],
    termsEn: 'Valid for 1 person. Booking required 48 hours in advance. Allergies must be communicated at time of booking. Valid Mon–Sat evenings only.',
  },
  {
    id: 9003,
    titleEn: '35% Off Afternoon Tea for Two',
    titleAr: 'خصم 35٪ على الشاي الإنجليزي لشخصين',
    descriptionEn: 'Enjoy a luxurious Afternoon Tea service at The Terrace featuring 3 tiers of freshly baked pastries, finger sandwiches, house-made scones, and unlimited premium teas and coffees.',
    descriptionAr: 'استمتع بخدمة شاي ما بعد الظهر الفاخرة في التيراس مع 3 طوابق من المعجنات والشطائر.',
    restaurantId: 5, restaurantNameEn: 'The Terrace', restaurantNameAr: 'التيراس',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    discountPercent: '35', originalPrice: '280', discountedPrice: '182', currency: 'SAR',
    validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 35, categoryEn: 'Café', city: 'Riyadh', rating: 4.6, reviews: 94,
    highlights: ['3-Tier Pastry Stand', 'Unlimited Tea & Coffee', 'Valid Weekends', 'City View Seating'],
    termsEn: 'Valid for 2 guests. Minimum age 12. Not valid on public holidays. Booking required 12 hours in advance.',
  },
  {
    id: 9004,
    titleEn: '30% Off BBQ Brunch Buffet',
    titleAr: 'خصم 30٪ على بوفيه الشواء',
    descriptionEn: 'Feast on an unlimited BBQ brunch at Reem Al Bawadi every Friday. Featuring live grill stations, traditional Saudi dishes, international spreads, fresh juices, and decadent dessert stations.',
    descriptionAr: 'استمتع ببوفيه شواء لا محدود كل جمعة في ريم البوادي مع محطات شواء حية وأطباق سعودية.',
    restaurantId: 2, restaurantNameEn: 'Reem Al Bawadi', restaurantNameAr: 'ريم البوادي',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    discountPercent: '30', originalPrice: '240', discountedPrice: '168', currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 50, categoryEn: 'Saudi Cuisine', city: 'Riyadh', rating: 4.5, reviews: 218,
    highlights: ['Unlimited Buffet', 'Live Grill Station', 'Fresh Juice Bar', 'Kids Eat Free Under 5'],
    termsEn: 'Valid Fridays only, 12PM–4PM. Maximum 1 voucher per person per visit. Kids under 5 eat free.',
  },
  {
    id: 9005,
    titleEn: '45% Off Business Lunch Set for One',
    titleAr: 'خصم 45٪ على غداء الأعمال لشخص واحد',
    descriptionEn: 'A premium 3-course business lunch at Hakkasan. Starter, signature main course, and dessert with choice of soft drink or Chinese tea. Perfect for corporate dining.',
    descriptionAr: 'غداء أعمال مكون من 3 أطباق في هاكاسان مع مشروب.',
    restaurantId: 5, restaurantNameEn: 'Hakkasan', restaurantNameAr: 'هاكاسان',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
    discountPercent: '45', originalPrice: '320', discountedPrice: '176', currency: 'SAR',
    validUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 12, categoryEn: 'Chinese', city: 'Riyadh', rating: 4.7, reviews: 289,
    highlights: ['3-Course Set Lunch', 'Weekdays Only', 'Includes Soft Drink', 'Private Room Available'],
    termsEn: 'Valid Mon–Thu lunch service 12PM–3PM. Single diner only. Receipt required for redemption.',
  },
  {
    id: 9006,
    titleEn: '25% Off Family Feast for 4',
    titleAr: 'خصم 25٪ على وجبة العائلة لـ4 أشخاص',
    descriptionEn: 'Bring the whole family for a feast at Burger & Lobster Jeddah. Includes 4 mains, 4 sides, 4 soft drinks, and a shared dessert platter. Great value for a family celebration.',
    descriptionAr: 'أحضر عائلتك لوجبة رائعة في برجر ولوبستر جدة لـ4 أشخاص.',
    restaurantId: 4, restaurantNameEn: 'Burger & Lobster', restaurantNameAr: 'برجر ولوبستر',
    restaurantCoverImageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    discountPercent: '25', originalPrice: '440', discountedPrice: '330', currency: 'SAR',
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 75, categoryEn: 'American', city: 'Jeddah', rating: 4.2, reviews: 156,
    highlights: ['4 Mains Included', '4 Sides Included', 'Shared Dessert', 'Kids Menu Available'],
    termsEn: 'Valid for exactly 4 guests. Not valid on Fridays. Booking required 24 hours in advance.',
  },
];

const CATEGORIES = ['All', 'Fine Dining', 'Japanese', 'Saudi Cuisine', 'Chinese', 'American', 'Café'];
const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'NEOM'];
const SORT_OPTIONS = ['Best Discount', 'Lowest Price', 'Highest Savings', 'Ending Soon', 'Most Popular'];

// ─── Helpers ──────────────────────────────────────────────────────
function timeUntil(dateStr: string | Date | null | undefined, lang: string): string {
  if (!dateStr) return '';
  const end = new Date(dateStr);
  const diffMs = end.getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffMs < 0) return lang === 'ar' ? 'انتهت' : 'Expired';
  if (diffHours < 24) return lang === 'ar' ? `ينتهي خلال ${diffHours} ساعة` : `Ends in ${diffHours}h`;
  if (diffDays === 1) return lang === 'ar' ? 'ينتهي غداً' : 'Ends tomorrow';
  if (diffDays <= 3) return lang === 'ar' ? `ينتهي خلال ${diffDays} أيام` : `Ends in ${diffDays} days`;
  return lang === 'ar' ? `${diffDays} يوماً متبقياً` : `${diffDays} days left`;
}

function savings(original: string | number, discounted: string | number): number {
  return Math.round(Number(original) - Number(discounted));
}

// ─── Fake Barcode SVG ─────────────────────────────────────────────
function BarcodeDisplay({ code }: { code: string }) {
  const bars = useMemo(() => {
    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 60 }, (_, i) => {
      const w = ((seed * (i + 7) * 13) % 3) + 1;
      const gap = ((seed * (i + 3) * 17) % 3);
      return { w, gap };
    });
  }, [code]);

  return (
    <div className="bg-white rounded-2xl p-5 text-center border border-border">
      <svg width="100%" height="64" viewBox="0 0 240 64" className="mx-auto mb-2">
        {bars.reduce<{ elements: JSX.Element[], x: number }>((acc, bar, i) => {
          const el = <rect key={i} x={acc.x} y={4} width={bar.w} height={56} fill="#1a1a1a" rx={0.5} />;
          return { elements: [...acc.elements, el], x: acc.x + bar.w + bar.gap + 1 };
        }, { elements: [], x: 0 }).elements}
      </svg>
      <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] select-all">{code}</p>
    </div>
  );
}

// ─── Fake QR Code ─────────────────────────────────────────────────
function QRCodeDisplay({ code }: { code: string }) {
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = Array.from({ length: 21 }, (_, r) =>
    Array.from({ length: 21 }, (_, c) => {
      // Corner squares
      if ((r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7)) {
        if ((r === 0 || r === 6) && c >= 0 && c <= 6) return true;
        if ((c === 0 || c === 6) && r >= 0 && r <= 6) return true;
        if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
        if ((r === 0 || r === 6) && c >= 14) return true;
        if ((c === 14 || c === 20) && r <= 6) return true;
        if (r >= 2 && r <= 4 && c >= 16 && c <= 18) return true;
        if ((r === 14 || r === 20) && c <= 6) return true;
        if ((c === 0 || c === 6) && r >= 14) return true;
        if (r >= 16 && r <= 18 && c >= 2 && c <= 4) return true;
        return false;
      }
      return ((seed * (r * 21 + c + 1) * 7919) % 2) === 0;
    })
  );

  return (
    <div className="bg-white rounded-2xl p-4 border border-border inline-block">
      <svg width="120" height="120" viewBox="0 0 21 21">
        {grid.map((row, r) =>
          row.map((filled, c) =>
            filled ? <rect key={`${r}-${c}`} x={c} y={r} width={0.95} height={0.95} fill="#1a1a1a" /> : null
          )
        )}
      </svg>
    </div>
  );
}

// ─── Full Offer Detail Panel ─────────────────────────────────────
type ExtendedOffer = Offer & {
  categoryEn?: string; city?: string; rating?: number; reviews?: number;
  highlights?: string[]; termsEn?: string;
};

function OfferDetailPanel({ offer, onClose }: { offer: ExtendedOffer; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const giftVoucher = useGiftVoucher();
  const purchaseVoucher = usePurchaseVoucher({
    mutation: {
      onSuccess: data => {
        if (giftMode && (recipientPhone || recipientEmail)) {
          giftVoucher.mutate(
            { voucherId: data.id, data: { recipientPhone: recipientPhone || undefined, recipientEmail: recipientEmail || undefined, giftMessage: giftMessage || undefined } },
            { onSuccess: () => { setVoucherCode(data.code); queryClient.invalidateQueries({ queryKey: ['vouchers'] }); }, onError: () => setVoucherCode(data.code) }
          );
        } else {
          setVoucherCode(data.code);
          queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        }
      },
    },
  });

  const isMock = offer.id >= 9000;
  const mockCode = `TBQ-${offer.id.toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const displayCode = voucherCode || (isMock ? mockCode : null);

  const discountedFinal = promoApplied
    ? Math.round(Number(offer.discountedPrice) * 0.9)
    : Number(offer.discountedPrice);

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'TABAQ10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError(t('Invalid promo code. Try TABAQ10 for 10% off!', 'رمز ترويجي غير صحيح. جرب TABAQ10 للحصول على 10٪ خصم!'));
    }
  };

  const copyCode = () => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const desc = lang === 'ar' ? offer.descriptionAr : offer.descriptionEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const savedAmount = savings(offer.originalPrice || 0, offer.discountedPrice || 0);

  return (
    <div className="bg-card border-2 border-primary/20 rounded-3xl overflow-hidden shadow-2xl mt-2">
      {/* Detail Header */}
      <div className="relative aspect-[21/9] overflow-hidden">
        <img src={offer.imageUrl || offer.restaurantCoverImageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=500&fit=crop'} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <button onClick={onClose} className="absolute top-4 end-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="absolute bottom-0 start-0 p-6 max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-destructive text-white font-black text-lg px-4 py-1.5 rounded-xl">-{Math.round(Number(offer.discountPercent))}%</span>
            {offer.categoryEn && <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full font-semibold">{offer.categoryEn}</span>}
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-extrabold mb-1">{title}</h2>
          <p className="text-white/75 flex items-center gap-1.5 text-sm">
            <Utensils className="w-4 h-4" />{restName}
            {offer.city && <><span className="opacity-40">·</span><MapPin className="w-3.5 h-3.5" />{offer.city}</>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Left: Info */}
        <div className="lg:col-span-3 p-6 space-y-6 border-e border-border">

          {/* Price Summary */}
          <div className="flex items-center gap-6 py-4 px-5 bg-green-50 border border-green-200 rounded-2xl">
            <div>
              <p className="text-xs text-muted-foreground">{t('Original Price', 'السعر الأصلي')}</p>
              <p className="text-xl font-bold text-muted-foreground line-through decoration-red-500">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-green-700">{t('Deal Price', 'سعر العرض')}</p>
              <p className="text-3xl font-black text-green-700">{offer.currency} {discountedFinal.toFixed(0)}</p>
            </div>
            <div className="ms-auto text-end">
              <p className="text-xs text-green-700">{t('You Save', 'توفر')}</p>
              <p className="text-xl font-extrabold text-green-700">{offer.currency} {promoApplied ? Math.round(Number(offer.originalPrice) - discountedFinal) : savedAmount}</p>
            </div>
          </div>

          {/* Highlights */}
          {(offer as any).highlights?.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{t("What's Included", 'ما يشمله العرض')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(offer as any).highlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 bg-secondary/40 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {desc && (
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-primary" />{t('About This Deal', 'عن هذا العرض')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          )}

          {/* Rating & Availability */}
          <div className="flex flex-wrap gap-4">
            {(offer as any).rating && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">{(offer as any).rating}</span>
                <span className="text-xs text-muted-foreground">({(offer as any).reviews} {t('reviews', 'تقييم')})</span>
              </div>
            )}
            {offer.remainingCapacity != null && offer.remainingCapacity > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-700">{offer.remainingCapacity} {t('spots left', 'مكان متبقٍ')}</span>
              </div>
            )}
            {offer.validUntil && (
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{timeUntil(offer.validUntil, lang)}</span>
              </div>
            )}
          </div>

          {/* How to Redeem */}
          <div>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><ScanLine className="w-4 h-4 text-primary" />{t('How to Redeem', 'كيفية الاسترداد')}</h3>
            <div className="space-y-2">
              {[
                { icon: '1', en: 'Purchase this deal — you\'ll receive a unique voucher code', ar: 'اشترِ هذا العرض — ستحصل على رمز قسيمة فريد' },
                { icon: '2', en: 'Make a booking at the restaurant via the Tabaq app', ar: 'احجز طاولة في المطعم عبر تطبيق طبق' },
                { icon: '3', en: 'Show the barcode or code below at the restaurant on arrival', ar: 'أظهر الباركود أو الرمز أدناه عند الوصول للمطعم' },
                { icon: '4', en: 'Enjoy your dining experience!', ar: 'استمتع بتجربتك الغذائية!' },
              ].map(step => (
                <div key={step.icon} className="flex items-start gap-3 py-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{step.icon}</div>
                  <p className="text-sm text-muted-foreground">{lang === 'ar' ? step.ar : step.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          {(offer as any).termsEn && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-muted-foreground list-none hover:text-foreground transition-colors">
                <Shield className="w-4 h-4" />{t('Terms & Conditions', 'الشروط والأحكام')}
                <ChevronDown className="w-4 h-4 ms-auto group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed ps-6 border-s-2 border-border">{(offer as any).termsEn}</p>
            </details>
          )}
        </div>

        {/* Right: Purchase */}
        <div className="lg:col-span-2 p-6 space-y-5 bg-secondary/20">

          {/* Voucher success state */}
          {displayCode && (purchaseVoucher.isSuccess || isMock) ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-800 text-lg">{t('Voucher Ready!', 'القسيمة جاهزة!')}</p>
                <p className="text-sm text-green-700">{t('Show at the restaurant to redeem.', 'أظهره في المطعم لاسترداده.')}</p>
              </div>

              <BarcodeDisplay code={displayCode} />

              <div className="flex justify-center">
                <QRCodeDisplay code={displayCode} />
              </div>

              <div className="flex gap-2">
                <button onClick={copyCode} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold transition-colors">
                  <Copy className="w-4 h-4" /> {copied ? t('Copied!', 'تم النسخ!') : t('Copy Code', 'نسخ الرمز')}
                </button>
                <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <Link href="/vouchers" className="flex-1">
                  <button className="w-full h-10 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                    {t('My Vouchers', 'قسائمي')}
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Price summary */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t('Deal price', 'سعر العرض')}</span>
                  <span className="font-bold">{offer.currency} {Number(offer.discountedPrice).toFixed(0)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between mb-2 text-green-700">
                    <span className="text-sm font-semibold flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{t('Promo (TABAQ10)', 'خصم إضافي')}</span>
                    <span className="font-bold">-{offer.currency} {Math.round(Number(offer.discountedPrice) * 0.1)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-foreground">{t('Total', 'المجموع')}</span>
                  <span className="text-xl font-extrabold text-primary">{offer.currency} {discountedFinal}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 bg-green-50 rounded-xl px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{t('You save', 'توفر')} {offer.currency} {promoApplied ? Math.round(Number(offer.originalPrice) - discountedFinal) : savedAmount} {t('on this deal', 'في هذا العرض')}</span>
                </div>
              </div>

              {/* Promo Code */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{t('Have a promo code?', 'لديك رمز ترويجي؟')}</p>
                {!promoApplied ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      placeholder="e.g. TABAQ10"
                      className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={applyPromo} className="px-4 h-10 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors border border-primary/20">
                      {t('Apply', 'تطبيق')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">TABAQ10 — 10% {t('off applied', 'خصم مطبّق')}</span>
                    <button onClick={() => { setPromoApplied(false); setPromoCode(''); }} className="ms-auto text-muted-foreground hover:text-foreground">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-destructive mt-1">{promoError}</p>}
              </div>

              {/* Auth notice */}
              {!user && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  {t('Sign in to purchase.', 'سجّل الدخول للشراء.')}{' '}
                  <Link href="/signin" className="font-bold underline">{t('Sign In', 'دخول')}</Link>
                </div>
              )}

              {/* Gift mode */}
              <div>
                <button
                  onClick={() => setGiftMode(!giftMode)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-sm ${giftMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <Gift className={`w-4 h-4 ${giftMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-semibold">{t('Send as a gift', 'أرسل كهدية')}</span>
                  {giftMode ? <ChevronUp className="w-4 h-4 ms-auto text-primary" /> : <ChevronDown className="w-4 h-4 ms-auto text-muted-foreground" />}
                </button>
                {giftMode && (
                  <div className="mt-2 space-y-2.5 p-4 bg-secondary/30 rounded-xl">
                    <input type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder={t('Recipient phone', 'هاتف المستلم')} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder={t('Recipient email (optional)', 'البريد (اختياري)')} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder={t('Personal message (optional)', 'رسالة شخصية (اختياري)')} className="w-full h-16 px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}
              </div>

              {/* Buy CTA */}
              <button
                onClick={() => {
                  if (!user && !isMock) return;
                  if (isMock) { setVoucherCode(mockCode); return; }
                  purchaseVoucher.mutate({ data: { offerId: offer.id } });
                }}
                disabled={!user && !isMock}
                className="w-full py-4 rounded-2xl bg-primary text-white font-extrabold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {purchaseVoucher.isPending ? t('Processing...', 'جاري المعالجة...') : giftMode ? t('Send Gift Voucher', 'إرسال قسيمة هدية') : `${t('Get Deal for', 'احصل على العرض بـ')} ${offer.currency} ${discountedFinal}`}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{t('Secure payment', 'دفع آمن')}</span>
                <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" />{t('Money-back guarantee', 'ضمان استرداد')}</span>
              </div>

              <Link href={`/restaurants/${offer.restaurantId}`} className="block">
                <div className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline justify-center">
                  <Utensils className="w-4 h-4" /> {t('View restaurant & book a table', 'عرض المطعم وحجز طاولة')}
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Offer Card (list-style, Groupon-like) ───────────────────────
function OfferCard({ offer, isExpanded, onToggle }: { offer: ExtendedOffer; isExpanded: boolean; onToggle: () => void }) {
  const { t, lang } = useLanguage();
  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const isSoldOut = offer.remainingCapacity !== null && offer.remainingCapacity !== undefined && offer.remainingCapacity <= 0;
  const savedAmount = savings(offer.originalPrice || 0, offer.discountedPrice || 0);
  const isUrgent = offer.remainingCapacity != null && offer.remainingCapacity <= 10;
  const endsIn3Days = offer.validUntil && (new Date(offer.validUntil).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/30 rounded-3xl' : ''}`}>
      <div
        className={`bg-card border border-border rounded-3xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Image */}
          <div className="relative sm:w-52 sm:shrink-0 aspect-[4/3] sm:aspect-auto">
            <img
              src={offer.imageUrl || offer.restaurantCoverImageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=400&fit=crop'}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-none" />
            {/* Badges */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5">
              <span className="bg-destructive text-white font-black text-base px-3 py-1 rounded-lg shadow-lg">
                -{Math.round(Number(offer.discountPercent))}%
              </span>
              {isSoldOut && <span className="bg-black/80 text-white text-xs font-bold px-2 py-0.5 rounded-md">{t('Sold Out', 'نفدت')}</span>}
              {isUrgent && !isSoldOut && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Flame className="w-3 h-3" />{t('Hot', 'ساخن')}</span>}
            </div>
            <div className="absolute bottom-3 start-3 sm:hidden">
              <p className="text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{restName}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="hidden sm:block text-sm font-bold text-foreground">{restName}</span>
                  {offer.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{offer.city}</span>}
                  {(offer as any).rating && (
                    <span className="text-xs font-semibold flex items-center gap-0.5 text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{(offer as any).rating}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-foreground text-base line-clamp-2">{title}</h3>
              </div>
              <div className="shrink-0 text-end">
                {isExpanded
                  ? <ChevronUp className="w-5 h-5 text-primary" />
                  : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </div>

            {(offer as any).highlights?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(offer as any).highlights.slice(0, 3).map((h: string, i: number) => (
                  <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-4 pt-3 border-t border-border">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground line-through decoration-red-400">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</span>
                <span className="text-2xl font-black text-primary">{offer.currency} {Number(offer.discountedPrice).toFixed(0)}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {offer.validUntil && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${endsIn3Days ? 'text-red-600' : 'text-muted-foreground'}`}>
                    <Clock className="w-3.5 h-3.5" />{timeUntil(offer.validUntil, lang)}
                  </div>
                )}
                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-xs text-green-700">{t('Save', 'وفّر')}</p>
                  <p className="text-sm font-extrabold text-green-700">{offer.currency} {savedAmount}</p>
                </div>
              </div>
            </div>

            {offer.remainingCapacity != null && offer.remainingCapacity > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, 100 - ((offer.remainingCapacity / 100) * 100)))}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{offer.remainingCapacity} {t('left', 'متبقٍ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline expanded detail */}
      {isExpanded && (
        <OfferDetailPanel offer={offer} onClose={onToggle} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export function OffersPage() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('Best Discount');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useListOffers({ active: true });

  // Merge API offers with mock offers, casting mocks to match Offer type
  const allOffers: ExtendedOffer[] = useMemo(() => {
    const apiOffers: ExtendedOffer[] = (data?.offers ?? []).map(o => ({
      ...o,
      categoryEn: 'Restaurant', city: 'Riyadh', rating: 4.5, reviews: 50,
      highlights: [], termsEn: 'Terms and conditions apply.',
    }));
    const mockOffers: ExtendedOffer[] = MOCK_OFFERS as unknown as ExtendedOffer[];
    const combined = [...apiOffers, ...mockOffers];
    return combined.filter((o, idx, arr) => arr.findIndex(x => x.id === o.id) === idx);
  }, [data]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = allOffers.filter(o => {
      const titleMatch = (o.titleEn?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (o.restaurantNameEn?.toLowerCase() || '').includes(search.toLowerCase());
      const catMatch = selectedCategory === 'All' || (o as any).categoryEn === selectedCategory;
      const cityMatch = selectedCity === 'All Cities' || (o as any).city === selectedCity;
      return titleMatch && catMatch && cityMatch;
    });

    if (sortBy === 'Best Discount') result.sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));
    else if (sortBy === 'Lowest Price') result.sort((a, b) => Number(a.discountedPrice) - Number(b.discountedPrice));
    else if (sortBy === 'Highest Savings') result.sort((a, b) => savings(b.originalPrice||0, b.discountedPrice||0) - savings(a.originalPrice||0, a.discountedPrice||0));
    else if (sortBy === 'Ending Soon') result.sort((a, b) => new Date(a.validUntil||9e15).getTime() - new Date(b.validUntil||9e15).getTime());
    return result;
  }, [allOffers, search, selectedCategory, selectedCity, sortBy]);

  const featuredOffer = filtered[0];
  const listOffers = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-orange-500 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 end-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
          <div className="absolute bottom-0 start-0 w-80 h-80 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center text-primary-foreground mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Flame className="w-4 h-4" /> {t('Limited Time Deals', 'عروض لفترة محدودة')}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              {t('Exclusive Restaurant Deals', 'عروض مطاعم حصرية')}
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              {t('Up to 50% off at Saudi Arabia\'s top restaurants. Limited vouchers — act fast.', 'خصم يصل إلى 50٪ في أفضل مطاعم المملكة. قسائم محدودة — تصرف بسرعة.')}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search deals, restaurants, or cuisine types…', 'ابحث عن العروض والمطاعم...')}
              className="w-full h-14 ps-12 pe-36 rounded-2xl bg-white text-foreground placeholder:text-muted-foreground text-sm font-medium shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute end-28 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute end-2 top-2 h-10 px-4 bg-foreground text-background rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" /> {t('Filter', 'تصفية')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-card border-b border-border sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Category pills */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all shrink-0 ${selectedCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
              >
                {cat === 'All' ? t('All Deals', 'جميع العروض') : cat}
              </button>
            ))}
            <div className="w-px h-6 bg-border shrink-0 mx-1" />
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all shrink-0 ${selectedCity === city ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/40'}`}
              >
                {city !== 'All Cities' && <MapPin className="w-3 h-3" />}
                {city === 'All Cities' ? t('All Cities', 'جميع المدن') : city}
              </button>
            ))}
            <div className="ms-auto shrink-0 flex items-center gap-2 ps-3">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 pe-3 ps-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="pb-2 text-xs text-muted-foreground">
            {filtered.length} {t('deals available', 'عرض متاح')}
            {search && <span> {t('for', 'لـ')} "<span className="font-semibold text-foreground">{search}</span>"</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{t('No deals found', 'لم يتم العثور على عروض')}</h3>
            <p className="text-muted-foreground mb-4">{t('Try adjusting your filters or search terms.', 'جرب تغيير معاملات التصفية.')}</p>
            <button onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedCity('All Cities'); }} className="text-primary font-semibold hover:underline">
              {t('Clear all filters', 'مسح جميع الفلاتر')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured offer */}
            {featuredOffer && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-primary" />
                  <h2 className="font-extrabold text-foreground text-lg">{t("Today's Top Deal", 'أفضل عرض اليوم')}</h2>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">{t('Featured', 'مميز')}</span>
                </div>
                <OfferCard
                  offer={featuredOffer}
                  isExpanded={expandedId === featuredOffer.id}
                  onToggle={() => setExpandedId(expandedId === featuredOffer.id ? null : featuredOffer.id)}
                />
              </div>
            )}

            {/* Rest of offers */}
            {listOffers.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-extrabold text-foreground text-lg">{t('All Deals', 'جميع العروض')}</h2>
                </div>
                <div className="space-y-4">
                  {listOffers.map(offer => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      isExpanded={expandedId === offer.id}
                      onToggle={() => setExpandedId(expandedId === offer.id ? null : offer.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trust bar */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Shield, en: 'Secure Payments', ar: 'دفع آمن', desc: 'SSL encrypted & PCI compliant' },
                { icon: RotateCcw, en: 'Money-Back Guarantee', ar: 'ضمان الاسترداد', desc: 'If the restaurant can\'t honour your voucher' },
                { icon: Zap, en: 'Instant Delivery', ar: 'تسليم فوري', desc: 'Your voucher code arrives immediately' },
                { icon: QrCode, en: 'Easy Redemption', ar: 'استرداد سهل', desc: 'Barcode or code shown at the restaurant' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.en} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{lang === 'ar' ? item.ar : item.en}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
