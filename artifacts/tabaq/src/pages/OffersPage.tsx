import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers, usePurchaseVoucher, useGiftVoucher, type Offer } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Tag, Clock, CheckCircle2, Gift, Copy, MapPin, Star,
  Search, Percent, ChevronRight, Flame, Sparkles,
  ScanLine, Info, ChevronDown, ChevronUp, Share2,
  ArrowLeft, X, Zap, Shield, RotateCcw, Utensils,
  Minus, Plus, Phone, Mail, MessageSquare, ThumbsUp,
  BadgeCheck, Heart, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

// ─── Mock offers ─────────────────────────────────────────────────
const MOCK_OFFERS = [
  {
    id: 9001,
    titleEn: '50% Off Premium Dining Set Menu for Two',
    titleAr: 'خصم 50٪ على قائمة الطعام المميزة لشخصين',
    descriptionEn: 'Indulge in a 4-course set menu for two at Najd Village — Saudi Arabia\'s most celebrated traditional restaurant. Includes welcome mezze, signature mains, dessert platter, and soft drinks.',
    descriptionAr: 'استمتع بقائمة طعام مكونة من 4 أطباق لشخصين في قرية نجد — أشهر مطعم تقليدي في المملكة.',
    restaurantId: 1, restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    ],
    discountPercent: '50', originalPrice: '380', discountedPrice: '190', currency: 'SAR',
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 18, boughtCount: 234,
    categoryEn: 'Fine Dining', city: 'Riyadh', rating: 4.8, reviews: 342,
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
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=900&h=600&fit=crop',
    ],
    discountPercent: '40', originalPrice: '650', discountedPrice: '390', currency: 'SAR',
    validUntil: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 6, boughtCount: 89,
    categoryEn: 'Japanese', city: 'Riyadh', rating: 4.9, reviews: 187,
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
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    ],
    discountPercent: '35', originalPrice: '280', discountedPrice: '182', currency: 'SAR',
    validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 35, boughtCount: 412,
    categoryEn: 'Café', city: 'Riyadh', rating: 4.6, reviews: 94,
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
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=600&fit=crop',
    ],
    discountPercent: '30', originalPrice: '240', discountedPrice: '168', currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 50, boughtCount: 678,
    categoryEn: 'Saudi Cuisine', city: 'Riyadh', rating: 4.5, reviews: 218,
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
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    ],
    discountPercent: '45', originalPrice: '320', discountedPrice: '176', currency: 'SAR',
    validUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 12, boughtCount: 156,
    categoryEn: 'Chinese', city: 'Riyadh', rating: 4.7, reviews: 289,
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
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    ],
    discountPercent: '25', originalPrice: '440', discountedPrice: '330', currency: 'SAR',
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    remainingCapacity: 75, boughtCount: 321,
    categoryEn: 'American', city: 'Jeddah', rating: 4.2, reviews: 156,
    highlights: ['4 Mains Included', '4 Sides Included', 'Shared Dessert', 'Kids Menu Available'],
    termsEn: 'Valid for exactly 4 guests. Not valid on Fridays. Booking required 24 hours in advance.',
  },
];

const CATEGORIES = ['All Deals', 'Fine Dining', 'Japanese', 'Saudi Cuisine', 'Chinese', 'American', 'Café'];
const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam'];

// ─── Types ────────────────────────────────────────────────────────
type MockOffer = typeof MOCK_OFFERS[0];
type ExtendedOffer = MockOffer & Partial<Offer>;

// ─── Helpers ──────────────────────────────────────────────────────
function timeUntil(dateStr: string | Date | null | undefined, lang: string): string {
  if (!dateStr) return '';
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMs < 0) return lang === 'ar' ? 'انتهت' : 'Expired';
  if (diffHours < 24) return lang === 'ar' ? `ينتهي خلال ${diffHours} ساعة` : `Ends in ${diffHours}h`;
  if (diffDays === 1) return lang === 'ar' ? 'ينتهي غداً' : 'Ends tomorrow';
  return lang === 'ar' ? `${diffDays} يوماً متبقياً` : `${diffDays} days left`;
}

// ─── Barcode SVG ──────────────────────────────────────────────────
function BarcodeDisplay({ code }: { code: string }) {
  const bars = useMemo(() => {
    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 60 }, (_, i) => ({
      w: ((seed * (i + 7) * 13) % 3) + 1,
      gap: ((seed * (i + 3) * 17) % 3),
    }));
  }, [code]);
  return (
    <div className="bg-white rounded-xl p-4 text-center border border-border">
      <svg width="100%" height="60" viewBox="0 0 240 60" className="mx-auto mb-2">
        {bars.reduce<{ els: React.ReactElement[]; x: number }>((acc, bar, i) => ({
          els: [...acc.els, <rect key={i} x={acc.x} y={3} width={bar.w} height={54} fill="#111" rx={0.3} />],
          x: acc.x + bar.w + bar.gap + 1,
        }), { els: [], x: 0 }).els}
      </svg>
      <p className="font-mono text-xs text-muted-foreground tracking-widest select-all">{code}</p>
    </div>
  );
}

// ─── QR Code SVG ─────────────────────────────────────────────────
function QRCodeDisplay({ code }: { code: string }) {
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = Array.from({ length: 21 }, (_, r) =>
    Array.from({ length: 21 }, (_, c) => {
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
    <div className="bg-white rounded-xl p-3 border border-border inline-block">
      <svg width="112" height="112" viewBox="0 0 21 21">
        {grid.map((row, r) => row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c} y={r} width={0.95} height={0.95} fill="#111" /> : null
        ))}
      </svg>
    </div>
  );
}

// ─── Listing Card (Groupon-style vertical card) ───────────────────
function DealCard({ offer, onSelect }: { offer: ExtendedOffer; onSelect: () => void }) {
  const { t, lang } = useLanguage();
  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const isSoldOut = (offer.remainingCapacity ?? 1) <= 0;
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10 && !isSoldOut;
  const savedAmt = Math.round(Number(offer.originalPrice) - Number(offer.discountedPrice));
  const daysLeft = Math.floor((new Date(offer.validUntil).getTime() - Date.now()) / 86400000);

  return (
    <div
      onClick={!isSoldOut ? onSelect : undefined}
      className={`group bg-card rounded-2xl overflow-hidden border border-border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/20 ${isSoldOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Discount badge */}
        <div className="absolute top-3 start-3">
          <span className="bg-red-500 text-white font-black text-sm px-2.5 py-1 rounded-lg shadow-md">
            -{Math.round(Number(offer.discountPercent))}%
          </span>
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black text-white font-bold px-4 py-2 rounded-xl text-sm">{t('Sold Out', 'نفدت')}</span>
          </div>
        )}
        {isUrgent && !isSoldOut && (
          <div className="absolute bottom-3 end-3">
            <span className="bg-red-500/95 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" /> {offer.remainingCapacity} {t('left', 'متبقٍ')}
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Restaurant + Category */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-primary truncate">{restName}</p>
          {offer.categoryEn && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0 ms-2">{offer.categoryEn}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">{title}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(offer.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-gray-200'}`} />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground">{offer.rating}</span>
          <span className="text-xs text-muted-foreground">({offer.reviews})</span>
          {offer.boughtCount > 0 && (
            <span className="text-xs text-muted-foreground ms-auto">{offer.boughtCount}+ {t('bought', 'تم الشراء')}</span>
          )}
        </div>

        {/* Price */}
        <div className="border-t border-border pt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground line-through">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</p>
              <p className="text-xl font-black text-foreground">{offer.currency} {Number(offer.discountedPrice).toFixed(0)}</p>
            </div>
            <div className="text-end">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                {t('Save', 'وفر')} {offer.currency} {savedAmt}
              </span>
            </div>
          </div>
          {/* Expiry */}
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {timeUntil(offer.validUntil, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Deal Detail Page (Groupon individual deal layout) ────────────
function DealDetailPage({ offer, onBack }: { offer: ExtendedOffer; onBack: () => void }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const detailRef = useRef<HTMLDivElement>(null);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [finePrintOpen, setFinePrintOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const isMock = offer.id >= 9000;
  const mockCode = `TBQ-${offer.id.toString(36).toUpperCase()}-${String(offer.id * 7 % 9999).padStart(4, '0')}`;

  const giftVoucher = useGiftVoucher();
  const purchaseVoucher = usePurchaseVoucher({
    mutation: {
      onSuccess: (data: any) => {
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

  const displayCode = voucherCode || (isMock && (purchaseVoucher.isSuccess || voucherCode) ? mockCode : null);
  const basePrice = Number(offer.discountedPrice);
  const promoDiscount = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const unitPrice = basePrice - promoDiscount;
  const totalPrice = unitPrice * qty;
  const savedAmount = Math.round(Number(offer.originalPrice) - Number(offer.discountedPrice));
  const totalSaved = Math.round(Number(offer.originalPrice) * qty - totalPrice);

  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const desc = lang === 'ar' ? offer.descriptionAr : offer.descriptionEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const images = (offer as any).images || [offer.imageUrl];

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'TABAQ10') { setPromoApplied(true); setPromoError(''); }
    else setPromoError(t('Invalid code. Try TABAQ10 for 10% off!', 'رمز غير صحيح. جرب TABAQ10!'));
  };

  const handleBuy = () => {
    if (isMock) { setVoucherCode(mockCode); return; }
    if (!user) return;
    purchaseVoucher.mutate({ data: { offerId: offer.id } });
  };

  // Scroll to top of detail on mount
  useEffect(() => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const daysLeft = Math.floor((new Date(offer.validUntil).getTime() - Date.now()) / 86400000);
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10;
  const isPurchased = !!(displayCode && (purchaseVoucher.isSuccess || isMock));

  return (
    <div ref={detailRef} className="bg-background">
      {/* ── Breadcrumb / Back bar ── */}
      <div className="border-b border-border bg-card sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Deals', 'العودة للعروض')}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{offer.city}</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{offer.categoryEn}</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium line-clamp-1 hidden sm:block">{title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Title + meta ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-red-500 text-white text-sm font-black px-3 py-1 rounded-lg">
                  -{Math.round(Number(offer.discountPercent))}% OFF
                </span>
                <span className="bg-secondary text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">{offer.categoryEn}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {offer.city}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">{title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/restaurants/${offer.restaurantId}`} className="text-primary font-semibold hover:underline text-sm flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5" /> {restName}
                </Link>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(offer.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                  ))}
                  <span className="text-sm font-bold text-foreground ms-1">{offer.rating}</span>
                  <span className="text-sm text-muted-foreground">({offer.reviews} {t('reviews', 'تقييم')})</span>
                </div>
                {(offer as any).boughtCount > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" /> {(offer as any).boughtCount}+ {t('bought', 'تم الشراء')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setSaved(!saved)}
              className="shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-red-300 transition-colors"
            >
              <Heart className={`w-5 h-5 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
          <div className="space-y-8 min-w-0">

            {/* Image gallery */}
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/9]">
                <img
                  src={images[activeImg]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                      className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))}
                      className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 end-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {activeImg + 1}/{images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* What You'll Get */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t("What You'll Get", 'ماذا ستحصل')}
                </h2>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {offer.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-foreground font-medium">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* About this deal */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {t('About This Deal', 'عن هذا العرض')}
                </h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: MapPin, label: offer.city },
                    { icon: Clock, label: timeUntil(offer.validUntil, lang) },
                    { icon: Tag, label: offer.categoryEn },
                  ].map(({ icon: Icon, label }) => label ? (
                    <div key={label} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>

            {/* Fine Print */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setFinePrintOpen(!finePrintOpen)}
                className="w-full px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {t('The Fine Print', 'الشروط والأحكام')}
                </h2>
                {finePrintOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {finePrintOpen && (
                <div className="px-6 py-5">
                  <ul className="space-y-2">
                    {offer.termsEn.split('. ').filter(Boolean).map((term, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-muted-foreground/40 font-bold mt-0.5">•</span>
                        <span>{term.trim()}{term.trim().endsWith('.') ? '' : '.'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* How to Redeem */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  {t('How to Redeem', 'كيفية الاسترداد')}
                </h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { n: 1, en: 'Purchase this deal and receive your unique voucher code instantly.', ar: 'اشترِ هذا العرض واحصل على رمز القسيمة فوراً.' },
                  { n: 2, en: 'Make a booking at the restaurant via the Tabaq app or by calling ahead.', ar: 'احجز طاولة في المطعم عبر تطبيق طبق أو بالاتصال.' },
                  { n: 3, en: 'Show the barcode or QR code at the restaurant on arrival to redeem.', ar: 'أظهر الباركود أو رمز QR عند الوصول للمطعم.' },
                  { n: 4, en: 'Enjoy your dining experience! Leave a review to earn Tabaq points.', ar: 'استمتع بتجربتك الغذائية! اترك تقييماً لكسب نقاط طبق.' },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{step.n}</div>
                    <p className="text-sm text-muted-foreground pt-1">{lang === 'ar' ? step.ar : step.en}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {t('Location', 'الموقع')}
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className="rounded-xl overflow-hidden bg-secondary/30 aspect-[16/6] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                    <p className="font-semibold text-foreground">{restName}</p>
                    <p className="text-sm">{offer.city}, Saudi Arabia</p>
                    <Link href={`/restaurants/${offer.restaurantId}`} className="mt-2 inline-block text-sm text-primary font-semibold hover:underline">
                      {t('View on map →', 'عرض على الخريطة ←')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN — Sticky purchase panel ═════════════ */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">

              {/* ── Voucher success state ── */}
              {isPurchased ? (
                <div className="p-6 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="font-extrabold text-green-800 text-lg">{t('Voucher Ready!', 'القسيمة جاهزة!')}</p>
                    <p className="text-sm text-green-700 mt-1">{t('Show at the restaurant to redeem.', 'أظهره في المطعم لاسترداده.')}</p>
                  </div>
                  <BarcodeDisplay code={displayCode!} />
                  <div className="flex justify-center">
                    <QRCodeDisplay code={displayCode!} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(displayCode!).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold transition-colors"
                    >
                      <Copy className="w-4 h-4" /> {copied ? t('Copied!', 'تم!') : t('Copy Code', 'نسخ الرمز')}
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Link href="/vouchers">
                    <button className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                      {t('View My Vouchers', 'عرض قسائمي')}
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">

                  {/* Price section */}
                  <div className="p-5">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-3xl font-black text-foreground">{offer.currency} {unitPrice}</span>
                      <span className="text-base text-muted-foreground line-through">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {t('Save', 'وفر')} {offer.currency} {promoApplied ? Math.round(Number(offer.originalPrice) - unitPrice) : savedAmount} ({offer.discountPercent}%{promoApplied ? '+10%' : ''})
                      </span>
                    </div>
                  </div>

                  {/* Urgency indicators */}
                  {(isUrgent || daysLeft <= 5) && (
                    <div className="px-5 py-3 bg-red-50 flex flex-wrap gap-3">
                      {isUrgent && offer.remainingCapacity != null && (
                        <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                          <Flame className="w-3.5 h-3.5" /> {offer.remainingCapacity} {t('spots remaining', 'مكان متبقٍ')}
                        </span>
                      )}
                      {daysLeft <= 5 && (
                        <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> {timeUntil(offer.validUntil, lang)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{t('Quantity', 'الكمية')}</span>
                      <span className="text-xs text-muted-foreground">{t('Max 10 per order', 'أقصى 10 لكل طلب')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                        disabled={qty <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center text-xl font-bold">{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(10, q + 1))}
                        className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                        disabled={qty >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="px-5 py-4 bg-secondary/20">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{offer.currency} {unitPrice} × {qty}</span>
                        <span className="font-semibold">{offer.currency} {totalPrice}</span>
                      </div>
                      {promoApplied && (
                        <div className="flex justify-between text-green-600">
                          <span>TABAQ10 (-10%)</span>
                          <span className="font-semibold">-{offer.currency} {promoDiscount * qty}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2 mt-2">
                        <span className="font-bold text-foreground">{t('Total', 'المجموع')}</span>
                        <span className="font-extrabold text-primary text-lg">{offer.currency} {totalPrice}</span>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 mt-1">
                        <Zap className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span className="text-xs font-semibold text-green-700">
                          {t('Total savings:', 'إجمالي التوفير:')} {offer.currency} {totalSaved}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Auth warning */}
                  {!user && !isMock && (
                    <div className="px-5 py-3 bg-amber-50 border-b-0">
                      <p className="text-xs text-amber-700">
                        {t('Sign in to purchase.', 'سجّل الدخول للشراء.')}{' '}
                        <Link href="/signin" className="font-bold underline">{t('Sign In', 'دخول')}</Link>
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="px-5 py-4">
                    <button
                      onClick={handleBuy}
                      disabled={(!user && !isMock) || purchaseVoucher.isPending}
                      className="w-full py-4 rounded-xl bg-primary text-white font-extrabold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {purchaseVoucher.isPending
                        ? t('Processing…', 'جاري المعالجة…')
                        : giftMode
                          ? t('Send Gift Voucher', 'إرسال قسيمة هدية')
                          : `${t('Get This Deal', 'احصل على العرض')} — ${offer.currency} ${totalPrice}`}
                    </button>

                    {/* Gift toggle */}
                    <button
                      onClick={() => setGiftMode(!giftMode)}
                      className={`mt-3 w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${giftMode ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'}`}
                    >
                      <Gift className="w-4 h-4" />
                      {t('Send as a Gift', 'أرسل كهدية')}
                      {giftMode ? <ChevronUp className="w-4 h-4 ms-auto" /> : <ChevronDown className="w-4 h-4 ms-auto" />}
                    </button>
                    {giftMode && (
                      <div className="mt-2 space-y-2 p-3 bg-secondary/30 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder={t('Recipient phone', 'هاتف المستلم')} className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder={t('Recipient email (optional)', 'البريد (اختياري)')} className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-1.5" />
                          <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder={t('Personal message (optional)', 'رسالة شخصية (اختياري)')} className="flex-1 h-16 px-3 py-1.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promo code */}
                  <div className="px-5 py-3">
                    <button
                      onClick={() => setPromoOpen(!promoOpen)}
                      className="w-full flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      {t('Have a promo code?', 'لديك رمز ترويجي؟')}
                      {promoOpen ? <ChevronUp className="w-3.5 h-3.5 ms-auto" /> : <ChevronDown className="w-3.5 h-3.5 ms-auto" />}
                    </button>
                    {promoOpen && (
                      <div className="mt-2">
                        {!promoApplied ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                              placeholder="e.g. TABAQ10"
                              className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button onClick={applyPromo} className="px-3 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                              {t('Apply', 'تطبيق')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">TABAQ10 — 10% {t('off', 'خصم')}</span>
                            <button onClick={() => { setPromoApplied(false); setPromoCode(''); }} className="ms-auto">
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Trust badges */}
                  <div className="px-5 py-4 bg-secondary/10">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Shield, label: t('Secure Payment', 'دفع آمن'), sub: t('256-bit SSL', 'SSL 256') },
                        { icon: RotateCcw, label: t('Money-back', 'استرداد المال'), sub: t('14-day guarantee', '14 يوم ضمان') },
                        { icon: BadgeCheck, label: t('Verified Deal', 'عرض موثوق'), sub: t('By Tabaq team', 'فريق طبق') },
                        { icon: Utensils, label: t('Book Anytime', 'احجز متى تشاء'), sub: t('Easy reservation', 'حجز سهل') },
                      ].map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-none">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View restaurant */}
                  <div className="px-5 py-4 text-center">
                    <Link href={`/restaurants/${offer.restaurantId}`} className="text-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      {t('View restaurant & book a table', 'عرض المطعم وحجز طاولة')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main OffersPage ──────────────────────────────────────────────
export function OffersPage() {
  const { t, lang } = useLanguage();
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [category, setCategory] = useState('All Deals');
  const [city, setCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('Best Discount');
  const listingRef = useRef<HTMLDivElement>(null);

  const { data: apiOffers } = useListOffers();

  const allOffers = useMemo<ExtendedOffer[]>(() => {
    const api = (Array.isArray(apiOffers) ? apiOffers : []) as ExtendedOffer[];
    const apiIds = new Set(api.map(o => o.id));
    return [...api, ...MOCK_OFFERS.filter(m => !apiIds.has(m.id))];
  }, [apiOffers]);

  const filtered = useMemo(() => {
    let result = allOffers;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      result = result.filter(o =>
        (o.titleEn || '').toLowerCase().includes(q) ||
        (o.restaurantNameEn || '').toLowerCase().includes(q) ||
        (o.categoryEn || '').toLowerCase().includes(q)
      );
    }
    if (category !== 'All Deals') result = result.filter(o => o.categoryEn === category);
    if (city !== 'All Cities') result = result.filter(o => o.city === city);
    if (sortBy === 'Best Discount') result = [...result].sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));
    if (sortBy === 'Lowest Price') result = [...result].sort((a, b) => Number(a.discountedPrice) - Number(b.discountedPrice));
    if (sortBy === 'Ending Soon') result = [...result].sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
    return result;
  }, [allOffers, searchQ, category, city, sortBy]);

  const handleSelectOffer = (offer: ExtendedOffer) => {
    setSelectedOffer(offer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedOffer(null);
    setTimeout(() => listingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ── Deal detail view ──
  if (selectedOffer) {
    return <DealDetailPage offer={selectedOffer} onBack={handleBack} />;
  }

  // ── Listing view ──
  return (
    <div className="bg-background min-h-screen" ref={listingRef}>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-primary via-violet-600 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 start-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-5">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            {t('Limited Time Deals', 'عروض لفترة محدودة')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t('Exclusive Restaurant Deals', 'عروض مطاعم حصرية')}
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            {t('Up to 50% off at Saudi Arabia\'s top restaurants. Limited vouchers — act fast.', 'خصم يصل إلى 50٪ في أفضل مطاعم المملكة. قسائم محدودة — تصرف الآن.')}
          </p>
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder={t('Search deals, restaurants, cuisines…', 'بحث عن عروض ومطاعم...')}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-1.5"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ('')}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shrink-0">
                {t('Search', 'بحث')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-20 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto hide-scrollbar">
            {/* Category pills */}
            <div className="flex items-center gap-2 shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    category === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {t(cat, cat)}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* City pills */}
            <div className="flex items-center gap-2 shrink-0">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    city === c
                      ? 'bg-foreground text-background'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {c !== 'All Cities' && <MapPin className="w-3 h-3" />}
                  {t(c, c)}
                </button>
              ))}
            </div>

            {/* Sort - pushed to end */}
            <div className="ms-auto shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {['Best Discount', 'Lowest Price', 'Ending Soon'].map(s => (
                  <option key={s} value={s}>{t(s, s)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deals grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span> {t('deals available', 'عرض متاح')}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">{t('No deals found. Try adjusting your filters.', 'لا توجد عروض. حاول تعديل الفلاتر.')}</p>
            <button onClick={() => { setCategory('All Deals'); setCity('All Cities'); setSearchQ(''); }} className="mt-4 text-primary font-semibold hover:underline text-sm">
              {t('Clear filters', 'مسح الفلاتر')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(offer => (
              <DealCard key={offer.id} offer={offer} onSelect={() => handleSelectOffer(offer)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
