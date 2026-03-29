import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListOffers, usePurchaseVoucher, useGiftVoucher, type Offer } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Tag, Clock, CheckCircle2, Gift, Copy, MapPin, Star,
  Search, Flame, ScanLine, Info,
  Share2, ArrowLeft, X, Shield, Utensils,
  Minus, Plus, Phone, Mail, MessageSquare,
  Heart, ChevronLeft, ChevronRight, ExternalLink,
  Ticket, Percent, AlertCircle, Users, BadgeCheck, QrCode
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';

// ─── Mock offers ─────────────────────────────────────────────────
const MOCK_OFFERS = [
  {
    id: 9001,
    titleEn: '50% Off Premium Dining Set Menu for Two',
    titleAr: 'خصم 50٪ على قائمة الطعام المميزة لشخصين',
    descriptionEn: 'Indulge in a 4-course set menu for two at Najd Village — Saudi Arabia\'s most celebrated traditional restaurant. Includes welcome mezze, signature mains, dessert platter, and soft drinks.',
    descriptionAr: 'استمتع بقائمة طعام مكونة من 4 أطباق لشخصين في قرية نجد — أشهر مطعم تقليدي في المملكة العربية السعودية.',
    restaurantId: 1, restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    ],
    discountPercent: '50', originalPrice: '380', discountedPrice: '190', currency: 'SAR',
    validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
    remainingCapacity: 18, boughtCount: 234,
    categoryEn: 'Fine Dining', city: 'Riyadh', rating: 4.8, reviews: 342,
    highlights: ['4-Course Set Menu', 'Welcome Mezze Included', 'Valid Sun–Thu', 'Table by Window Available'],
    termsEn: 'Valid for 2 guests only. Advance booking required 24 hours before. Not valid with any other offer. Non-refundable once purchased. Valid 7 days from purchase date.',
    address: 'Al Hamra District, Riyadh 12943',
    latitude: 24.6877, longitude: 46.7219,
  },
  {
    id: 9002,
    titleEn: '40% Off Omakase Dinner Experience',
    titleAr: 'خصم 40٪ على تجربة عشاء أوماكاسي',
    descriptionEn: 'Experience the finest Japanese Omakase at Sushi Sama. The chef curates 12 seasonal courses using the freshest daily imported fish. A truly unmissable culinary journey.',
    descriptionAr: 'اختبر أرقى الأوماكاسي الياباني في سوشي ساما. يختار الشيف 12 طبقاً موسمياً يومياً من أطازج الأسماك.',
    restaurantId: 3, restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=900&h=600&fit=crop',
    ],
    discountPercent: '40', originalPrice: '650', discountedPrice: '390', currency: 'SAR',
    validUntil: new Date(Date.now() + 12 * 86400000).toISOString(),
    remainingCapacity: 6, boughtCount: 89,
    categoryEn: 'Japanese', city: 'Riyadh', rating: 4.9, reviews: 187,
    highlights: ['12 Seasonal Courses', 'Chef\'s Selection Daily', 'Sake Pairing Add-on Available', 'Private Counter Seating'],
    termsEn: 'Valid for 1 person. Booking required 48 hours in advance. Allergies must be communicated at time of booking. Valid Mon–Sat evenings only.',
    address: 'Olaya Street, Riyadh 12611',
    latitude: 24.7136, longitude: 46.6753,
  },
  {
    id: 9003,
    titleEn: '35% Off Afternoon Tea for Two',
    titleAr: 'خصم 35٪ على الشاي الإنجليزي لشخصين',
    descriptionEn: 'Enjoy a luxurious Afternoon Tea service at The Terrace featuring 3 tiers of freshly baked pastries, finger sandwiches, house-made scones, and unlimited premium teas and coffees.',
    descriptionAr: 'استمتع بخدمة شاي ما بعد الظهر الفاخرة في التيراس مع 3 طوابق من المعجنات والشطائر المتنوعة.',
    restaurantId: 5, restaurantNameEn: 'The Terrace', restaurantNameAr: 'التيراس',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop'],
    discountPercent: '35', originalPrice: '280', discountedPrice: '182', currency: 'SAR',
    validUntil: new Date(Date.now() + 21 * 86400000).toISOString(),
    remainingCapacity: 35, boughtCount: 412,
    categoryEn: 'Café', city: 'Riyadh', rating: 4.6, reviews: 94,
    highlights: ['3-Tier Pastry Stand', 'Unlimited Tea & Coffee', 'Valid Weekends', 'City View Seating'],
    termsEn: 'Valid for 2 guests. Minimum age 12. Not valid on public holidays. Booking required 12 hours in advance.',
    address: 'Kingdom Tower, Riyadh 12214',
    latitude: 24.7104, longitude: 46.6778,
  },
  {
    id: 9004,
    titleEn: '30% Off BBQ Brunch Buffet',
    titleAr: 'خصم 30٪ على بوفيه الشواء',
    descriptionEn: 'Feast on an unlimited BBQ brunch at Reem Al Bawadi every Friday. Featuring live grill stations, traditional Saudi dishes, international spreads, fresh juices, and decadent dessert stations.',
    descriptionAr: 'استمتع ببوفيه شواء لا محدود كل جمعة في ريم البوادي مع محطات شواء حية وأطباق سعودية أصيلة.',
    restaurantId: 2, restaurantNameEn: 'Reem Al Bawadi', restaurantNameAr: 'ريم البوادي',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop'],
    discountPercent: '30', originalPrice: '240', discountedPrice: '168', currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    remainingCapacity: 50, boughtCount: 678,
    categoryEn: 'Saudi Cuisine', city: 'Riyadh', rating: 4.5, reviews: 218,
    highlights: ['Unlimited Buffet', 'Live Grill Station', 'Fresh Juice Bar', 'Kids Eat Free Under 5'],
    termsEn: 'Valid Fridays only, 12PM–4PM. Maximum 1 voucher per person per visit. Kids under 5 eat free.',
    address: 'Al Aqiq, Riyadh 13522',
    latitude: 24.7489, longitude: 46.6389,
  },
  {
    id: 9005,
    titleEn: '45% Off Business Lunch Set for One',
    titleAr: 'خصم 45٪ على غداء الأعمال لشخص واحد',
    descriptionEn: 'A premium 3-course business lunch at Hakkasan. Starter, signature main course, and dessert with choice of soft drink or Chinese tea. Perfect for corporate dining.',
    descriptionAr: 'غداء أعمال فاخر مكون من 3 أطباق في هاكاسان مع مشروب من اختيارك.',
    restaurantId: 5, restaurantNameEn: 'Hakkasan', restaurantNameAr: 'هاكاسان',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop'],
    discountPercent: '45', originalPrice: '320', discountedPrice: '176', currency: 'SAR',
    validUntil: new Date(Date.now() + 8 * 86400000).toISOString(),
    remainingCapacity: 12, boughtCount: 156,
    categoryEn: 'Chinese', city: 'Riyadh', rating: 4.7, reviews: 289,
    highlights: ['3-Course Set Lunch', 'Weekdays Only', 'Includes Soft Drink', 'Private Room Available'],
    termsEn: 'Valid Mon–Thu lunch service 12PM–3PM. Single diner only. Receipt required for redemption.',
    address: 'Rosewood Hotel, Riyadh 12261',
    latitude: 24.6893, longitude: 46.6842,
  },
  {
    id: 9006,
    titleEn: '25% Off Family Feast for 4',
    titleAr: 'خصم 25٪ على وجبة العائلة لـ4 أشخاص',
    descriptionEn: 'Bring the whole family for a feast at Burger & Lobster Jeddah. Includes 4 mains, 4 sides, 4 soft drinks, and a shared dessert platter.',
    descriptionAr: 'أحضر عائلتك لوجبة رائعة في برجر ولوبستر جدة تشمل 4 وجبات رئيسية ومشروبات وحلوى مشتركة.',
    restaurantId: 4, restaurantNameEn: 'Burger & Lobster', restaurantNameAr: 'برجر ولوبستر',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop'],
    discountPercent: '25', originalPrice: '440', discountedPrice: '330', currency: 'SAR',
    validUntil: new Date(Date.now() + 45 * 86400000).toISOString(),
    remainingCapacity: 75, boughtCount: 321,
    categoryEn: 'American', city: 'Jeddah', rating: 4.2, reviews: 156,
    highlights: ['4 Mains Included', '4 Sides Included', 'Shared Dessert', 'Kids Menu Available'],
    termsEn: 'Valid for exactly 4 guests. Not valid on Fridays. Booking required 24 hours in advance.',
    address: 'Al Rawdah, Jeddah 23432',
    latitude: 21.5433, longitude: 39.1728,
  },
];

const CATEGORIES = ['All', 'Fine Dining', 'Japanese', 'Saudi Cuisine', 'Chinese', 'American', 'Café'];
const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam'];
const SORT_OPTIONS = ['Best Match', 'Discount %', 'Price: Low', 'Price: High', 'Ending Soon'];

type MockOffer = typeof MOCK_OFFERS[0];
type ExtendedOffer = MockOffer & Partial<Offer>;

function timeUntil(dateStr: string | Date | null | undefined, lang: string): string {
  if (!dateStr) return '';
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMs < 0) return lang === 'ar' ? 'انتهت' : 'Expired';
  if (diffHours < 24) return lang === 'ar' ? `${diffHours}س متبقية` : `${diffHours}h left`;
  if (diffDays === 1) return lang === 'ar' ? 'ينتهي غداً' : 'Ends tomorrow';
  return lang === 'ar' ? `${diffDays} أيام` : `${diffDays}d left`;
}

// ─── Barcode ──────────────────────────────────────────────────────
function BarcodeDisplay({ code }: { code: string }) {
  const bars = useMemo(() => {
    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 52 }, (_, i) => ({
      w: ((seed * (i + 7) * 13) % 3) + 1,
      gap: ((seed * (i + 3) * 17) % 2),
    }));
  }, [code]);
  return (
    <div className="bg-white rounded-lg p-4 text-center border border-border/60">
      <svg width="100%" height="56" viewBox="0 0 220 56" className="mx-auto mb-2">
        {bars.reduce<{ els: React.ReactElement[]; x: number }>((acc, bar, i) => ({
          els: [...acc.els, <rect key={i} x={acc.x} y={2} width={bar.w} height={52} fill="#0f0f0f" rx={0.2} />],
          x: acc.x + bar.w + bar.gap + 0.8,
        }), { els: [], x: 4 }).els}
      </svg>
      <p className="font-mono text-[11px] text-muted-foreground tracking-[0.2em] select-all">{code}</p>
    </div>
  );
}

// ─── QR Code ──────────────────────────────────────────────────────
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
    <div className="bg-white rounded-lg p-3 border border-border/60 inline-block">
      <svg width="108" height="108" viewBox="0 0 21 21">
        {grid.map((row, r) => row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c} y={r} width={0.92} height={0.92} fill="#0f0f0f" /> : null
        ))}
      </svg>
    </div>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────
function DealCard({ offer, onSelect }: { offer: ExtendedOffer; onSelect: () => void }) {
  const { t, lang } = useLanguage();
  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const isSoldOut = (offer.remainingCapacity ?? 1) <= 0;
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10 && !isSoldOut;
  const saved = Math.round(Number(offer.originalPrice) - Number(offer.discountedPrice));
  const daysLeft = Math.floor((new Date(offer.validUntil).getTime() - Date.now()) / 86400000);
  const discount = Math.round(Number(offer.discountPercent));

  return (
    <div
      onClick={!isSoldOut ? onSelect : undefined}
      className={`group bg-card rounded-xl overflow-hidden border border-border shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 ${isSoldOut ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={offer.imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
        <div className="absolute top-2.5 start-2.5 flex gap-1.5">
          <span className="bg-red-500 text-white font-black text-sm px-2.5 py-1 rounded-md shadow-sm leading-none">
            -{discount}%
          </span>
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="bg-black/90 text-white font-bold px-4 py-2 rounded-lg text-sm tracking-wide">{t('Sold Out', 'نفدت')}</span>
          </div>
        )}
        {isUrgent && (
          <div className="absolute bottom-2.5 end-2.5">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Flame className="w-2.5 h-2.5" /> {offer.remainingCapacity} {t('left', 'متبقٍ')}
            </span>
          </div>
        )}
        <button className="absolute top-2.5 end-2.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white">
          <Heart className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-primary truncate">{restName}</p>
          <span className="text-[11px] text-muted-foreground shrink-0 ms-2">{offer.city}</span>
        </div>
        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2.5 min-h-[2.5rem] tracking-[-0.01em]">{title}</h3>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(offer.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
            ))}
          </div>
          <span className="text-xs font-semibold text-foreground">{offer.rating}</span>
          <span className="text-xs text-muted-foreground">({offer.reviews})</span>
          <span className="ms-auto text-xs text-muted-foreground">{offer.boughtCount}+ {t('bought', 'تم شراؤه')}</span>
        </div>

        <div className="border-t border-border/60 pt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground line-through leading-none mb-0.5">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</p>
            <p className="text-lg font-black text-foreground leading-none">{offer.currency} {Number(offer.discountedPrice).toFixed(0)}</p>
          </div>
          <div className="text-end">
            <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
              {t('Save', 'وفر')} {offer.currency} {saved}
            </span>
            <p className={`text-[11px] mt-1 font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {timeUntil(offer.validUntil, lang)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Deal Detail ──────────────────────────────────────────────────
function DealDetailPage({ offer, onBack }: { offer: ExtendedOffer; onBack: () => void }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const topRef = useRef<HTMLDivElement>(null);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'qr' | 'barcode'>('qr');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [finePrintOpen, setFinePrintOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

  const displayCode = voucherCode || (isMock && purchaseVoucher.isSuccess ? mockCode : null);
  const basePrice = Number(offer.discountedPrice);
  const promoDiscount = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const unitPrice = basePrice - promoDiscount;
  const totalPrice = unitPrice * qty;
  const savedTotal = Math.round(Number(offer.originalPrice) * qty - totalPrice);
  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const desc = lang === 'ar' ? offer.descriptionAr : offer.descriptionEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const images = (offer as any).images || [offer.imageUrl];
  const daysLeft = Math.floor((new Date(offer.validUntil).getTime() - Date.now()) / 86400000);
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10;
  const isPurchased = !!(displayCode);

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  const copyCode = () => {
    if (displayCode) { navigator.clipboard.writeText(displayCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'TABAQ10') { setPromoApplied(true); setPromoError(''); }
    else setPromoError(t('Invalid code. Try TABAQ10 for 10% off.', 'رمز غير صحيح. جرب TABAQ10 لخصم 10٪.'));
  };

  const handleBuy = () => {
    if (isMock) { setVoucherCode(mockCode); return; }
    if (!user) return;
    purchaseVoucher.mutate({ data: { offerId: offer.id } });
  };

  const shareUrl = `${window.location.origin}/offers?deal=${offer.id}`;

  return (
    <div ref={topRef}>
      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-card sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-1.5 text-sm">
          <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('Deals', 'العروض')}
          </button>
          <ChevronRight className="w-3 h-3 text-border" />
          <span className="text-muted-foreground">{offer.categoryEn}</span>
          <ChevronRight className="w-3 h-3 text-border" />
          <span className="text-foreground font-medium line-clamp-1 hidden sm:block">{restName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* Left Column */}
          <div>
            {/* Image Gallery */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/9] mb-3 shadow-sm">
              <img src={images[activeImg]} alt={title} className="w-full h-full object-cover" />
              {isUrgent && (
                <div className="absolute top-4 start-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Flame className="w-3.5 h-3.5" /> {offer.remainingCapacity} {t('spots left', 'مقعد متبق')}
                </div>
              )}
              <div className="absolute top-4 end-4 flex items-center gap-2">
                <button onClick={() => setSaved(s => !s)} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${saved ? 'bg-red-500' : 'bg-white/90'}`}>
                  <Heart className={`w-4 h-4 ${saved ? 'fill-white text-white' : 'text-foreground'}`} />
                </button>
                <div className="relative">
                  <button onClick={() => setShareOpen(o => !o)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                    <Share2 className="w-4 h-4 text-foreground" />
                  </button>
                  {shareOpen && (
                    <div className="absolute end-0 top-11 bg-card border border-border rounded-xl shadow-xl p-3 w-52 z-50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{t('Share this deal', 'شارك هذا العرض')}</p>
                      {[
                        { label: 'Copy link', icon: Copy, action: () => { navigator.clipboard.writeText(shareUrl).catch(() => {}); setShareOpen(false); } },
                        { label: 'WhatsApp', icon: MessageSquare, action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`); setShareOpen(false); } },
                        { label: 'X / Twitter', icon: ExternalLink, action: () => { window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`); setShareOpen(false); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => Math.max(0, i - 1))} className="absolute start-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))} className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mb-6">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-11 rounded-lg overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title + Meta */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-red-500 text-white font-black text-sm px-3 py-1 rounded-md">
                  -{Math.round(Number(offer.discountPercent))}% OFF
                </span>
                <span className="bg-secondary text-foreground text-xs font-semibold px-3 py-1 rounded-full">{offer.categoryEn}</span>
                {isUrgent && (
                  <span className="text-red-500 text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {t('Selling fast!', 'ينفد بسرعة!')}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3 tracking-[-0.025em]">{title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <Link href={`/restaurants/${offer.restaurantId}`} className="flex items-center gap-1.5 text-primary font-semibold hover:underline">
                  <Utensils className="w-3.5 h-3.5" /> {restName}
                </Link>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{offer.rating}</span>
                  <span className="text-muted-foreground">({offer.reviews} {t('reviews', 'تقييم')})</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" /> {offer.city}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> {offer.boughtCount}+ {t('bought', 'اشترى')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground mb-2">{t('About this deal', 'عن هذا العرض')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>

            {/* Highlights */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground mb-3">{t("What's included", 'ما يتضمنه')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {offer.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground mb-3">{t('Location', 'الموقع')}</h2>
              <div className="rounded-xl overflow-hidden border border-border/60 bg-secondary/30">
                <div className="h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, #666 24px, #666 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, #666 24px, #666 25px)'
                    }}
                  />
                  <div className="relative flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-lg">
                      <MapPin className="w-5 h-5 text-primary fill-primary/20" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{restName}</p>
                    <p className="text-xs text-muted-foreground">{(offer as any).address || offer.city}</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{restName}</p>
                    <p className="text-xs text-muted-foreground">{(offer as any).address || offer.city}</p>
                  </div>
                  <a href={`https://maps.google.com/?q=${(offer as any).latitude},${(offer as any).longitude}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> {t('Open in Maps', 'فتح في الخرائط')}
                  </a>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <button onClick={() => setFinePrintOpen(o => !o)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/40 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info className="w-4 h-4 text-muted-foreground" /> {t('Terms & Fine Print', 'الشروط والأحكام')}
                </span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${finePrintOpen ? 'rotate-90' : ''}`} />
              </button>
              {finePrintOpen && (
                <div className="px-4 pb-4 border-t border-border/60">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-3">{offer.termsEn}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Purchase Card */}
          <div className="lg:sticky lg:top-28 self-start">
            {isPurchased ? (
              /* Redemption Card */
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-emerald-500 px-5 py-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-bold text-base">{t('Voucher Activated!', 'تم تفعيل الكوبون!')}</p>
                  </div>
                  <p className="text-emerald-100 text-sm">{t('Show this at the restaurant', 'اعرض هذا في المطعم')}</p>
                </div>

                {/* QR / Barcode toggle */}
                <div className="p-5">
                  <div className="flex items-center bg-secondary rounded-lg p-1 mb-4 gap-1">
                    {(['qr', 'barcode'] as const).map(mode => (
                      <button key={mode} onClick={() => setTab(mode)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-md transition-all ${tab === mode ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                        {mode === 'qr' ? <QrCode className="w-3.5 h-3.5" /> : <ScanLine className="w-3.5 h-3.5" />}
                        {mode === 'qr' ? 'QR Code' : 'Barcode'}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center mb-4">
                    {tab === 'qr' ? <QRCodeDisplay code={displayCode!} /> : <BarcodeDisplay code={displayCode!} />}
                  </div>

                  <div className="flex items-center gap-2 bg-secondary rounded-lg p-2.5 mb-4">
                    <code className="text-sm font-mono font-bold text-foreground flex-1 text-center tracking-wider select-all">{displayCode}</code>
                    <button onClick={copyCode} className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}>
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    {[
                      { label: t('Saved', 'وفرت'), val: `${offer.currency} ${Math.round(Number(offer.originalPrice) - Number(offer.discountedPrice))}`, color: 'text-emerald-600 font-bold' },
                      { label: t('Valid Until', 'صالح حتى'), val: new Date(offer.validUntil).toLocaleDateString(), color: 'text-foreground font-semibold' },
                    ].map(s => (
                      <div key={s.label} className="bg-secondary rounded-lg p-2.5">
                        <p className="text-muted-foreground mb-0.5">{s.label}</p>
                        <p className={s.color}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    {t('Tabaq Buyer Protection', 'حماية المشتري من طبق')}
                  </div>
                  <Link href="/vouchers" className="text-xs font-semibold text-primary hover:underline">
                    {t('My Vouchers', 'كوباناتي')} →
                  </Link>
                </div>
              </div>
            ) : (
              /* Purchase Card */
              <div className="bg-card rounded-xl border border-border shadow-sm">
                {/* Price Header */}
                <div className="p-5 border-b border-border/60">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm text-muted-foreground line-through">{offer.currency} {Number(offer.originalPrice).toFixed(0)}</p>
                      <p className="text-3xl font-black text-foreground leading-none">{offer.currency} {unitPrice.toFixed(0)}</p>
                    </div>
                    <span className="bg-red-50 text-red-600 font-black text-sm px-2.5 py-1.5 rounded-md">-{Math.round(Number(offer.discountPercent))}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                      {t('You save', 'توفر')} {offer.currency} {savedTotal}
                    </span>
                    <span className={`text-xs font-medium flex items-center gap-1 ms-auto ${daysLeft <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      <Clock className="w-3 h-3" /> {timeUntil(offer.validUntil, lang)}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Qty */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{t('Quantity', 'الكمية')}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40" disabled={qty <= 1}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(10, q + 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40" disabled={qty >= 10}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Gift toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{t('Send as gift', 'إرسال كهدية')}</p>
                    </div>
                    <button onClick={() => setGiftMode(g => !g)} className={`relative w-10 h-5.5 rounded-full transition-colors ${giftMode ? 'bg-primary' : 'bg-border'}`} style={{ height: 22 }}>
                      <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${giftMode ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ width: 18, height: 18, transform: giftMode ? 'translateX(20px)' : 'translateX(2px)' }} />
                    </button>
                  </div>

                  {giftMode && (
                    <div className="space-y-2 pt-1">
                      <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder={t('Recipient phone (optional)', 'رقم هاتف المستلم (اختياري)')} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                      <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder={t('Recipient email (optional)', 'بريد المستلم (اختياري)')} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                      <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder={t('Add a gift message...', 'أضف رسالة هدية...')} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none" />
                    </div>
                  )}

                  {/* Promo */}
                  <div>
                    <div className="flex gap-2">
                      <input value={promoCode} onChange={e => { setPromoCode(e.target.value); setPromoError(''); }} placeholder={t('Promo code', 'رمز الخصم')} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-mono uppercase" />
                      <button onClick={applyPromo} disabled={!promoCode.trim() || promoApplied} className="text-sm font-semibold px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors disabled:opacity-40">
                        {promoApplied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : t('Apply', 'تطبيق')}
                      </button>
                    </div>
                    {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                    {promoApplied && <p className="text-xs text-emerald-600 mt-1 font-semibold">✓ TABAQ10 applied — 10% extra off</p>}
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-secondary/50 rounded-xl p-3.5 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{offer.currency} {Number(offer.discountedPrice).toFixed(0)} × {qty}</span>
                      <span>{offer.currency} {(Number(offer.discountedPrice) * qty).toFixed(0)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Promo (TABAQ10)</span>
                        <span>-{offer.currency} {(promoDiscount * qty).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold text-foreground">
                      <span>{t('Total', 'الإجمالي')}</span>
                      <span>{offer.currency} {totalPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                      <span>{t('You save', 'توفر')}</span>
                      <span>{offer.currency} {savedTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={purchaseVoucher.isPending}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    {purchaseVoucher.isPending ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        {giftMode ? t('Buy & Send as Gift', 'اشترِ وأرسل كهدية') : t('Get This Deal', 'احصل على العرض')}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    {t('Secure checkout · Money-back guarantee', 'دفع آمن · ضمان استرداد')}
                  </div>
                </div>

                <div className="border-t border-border/60 px-5 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    {t('Verified by Tabaq. This deal has been reviewed for authenticity.', 'تم التحقق من صحة هذا العرض من قبل طبق.')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export function OffersPage() {
  const { t, lang } = useLanguage();
  const { data: rawApiOffers } = useListOffers({});
  const apiOffers = Array.isArray(rawApiOffers) ? rawApiOffers : (rawApiOffers as any)?.offers ?? (rawApiOffers as any)?.data ?? [];
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('Best Match');
  const [search, setSearch] = useState('');

  const allOffers = useMemo<ExtendedOffer[]>(() => {
    const api: ExtendedOffer[] = (apiOffers ?? []).map((o) => ({
      id: o.id,
      titleEn: o.titleEn,
      titleAr: o.titleAr,
      descriptionEn: o.descriptionEn ?? '',
      descriptionAr: o.descriptionAr ?? '',
      restaurantId: o.restaurantId,
      restaurantNameEn: 'Restaurant',
      restaurantNameAr: 'مطعم',
      imageUrl: o.imageUrl ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      images: [o.imageUrl ?? ''],
      discountPercent: String(o.discountPercent ?? 20),
      originalPrice: String(o.originalPrice ?? 200),
      discountedPrice: String(o.discountedPrice ?? 160),
      currency: o.currency,
      validUntil: o.validUntil,
      remainingCapacity: o.remainingCapacity ?? 50,
      boughtCount: 0,
      categoryEn: 'Restaurant',
      city: 'Riyadh',
      rating: 4.5,
      reviews: 0,
      highlights: [],
      termsEn: 'Terms apply.',
      address: '',
    }));
    return [...MOCK_OFFERS, ...api];
  }, [apiOffers]);

  const filtered = useMemo(() => {
    let result = allOffers;
    if (search) result = result.filter(o => (o.titleEn + o.titleAr + o.restaurantNameEn).toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') result = result.filter(o => o.categoryEn === category);
    if (city !== 'All Cities') result = result.filter(o => o.city === city);
    if (sortBy === 'Discount %') result = [...result].sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));
    if (sortBy === 'Price: Low') result = [...result].sort((a, b) => Number(a.discountedPrice) - Number(b.discountedPrice));
    if (sortBy === 'Price: High') result = [...result].sort((a, b) => Number(b.discountedPrice) - Number(a.discountedPrice));
    if (sortBy === 'Ending Soon') result = [...result].sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
    return result;
  }, [allOffers, search, category, city, sortBy]);

  if (selectedOffer) {
    return <DealDetailPage offer={selectedOffer} onBack={() => setSelectedOffer(null)} />;
  }

  const featuredOffer = allOffers[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-950 via-primary to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
              <Percent className="w-3 h-3" />
              {t('Exclusive Restaurant Deals', 'عروض مطاعم حصرية')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight mb-3">
              {t('Save Up to 50% at Top Restaurants', 'وفّر حتى 50٪ في أفضل المطاعم')}
            </h1>
            <p className="text-purple-100 text-base mb-6 max-w-xl leading-relaxed">
              {t('Curated deals from the finest dining spots across Saudi Arabia. Buy once, dine beautifully.', 'عروض مختارة من أرقى أماكن الطعام في المملكة العربية السعودية.')}
            </p>
            <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl overflow-hidden max-w-md">
              <Search className="w-4 h-4 text-muted-foreground ms-3.5 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Search deals, restaurants, cuisine...', 'ابحث عن عروض، مطاعم...')}
                className="flex-1 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-2 hover:bg-secondary/50 rounded-lg me-1">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat === 'All' ? t('All Deals', 'كل العروض') : cat}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-border shrink-0 mx-1" />
            <select value={city} onChange={e => setCity(e.target.value)} className="text-xs font-semibold bg-secondary border-0 rounded-full px-3.5 py-1.5 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shrink-0">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs font-semibold bg-secondary border-0 rounded-full px-3.5 py-1.5 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shrink-0">
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured deal */}
        {!search && category === 'All' && city === 'All Cities' && featuredOffer && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground tracking-[-0.02em]">
                {t("Today's Featured Deal", 'عرض اليوم المميز')}
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">{t('Editor\'s Pick', 'اختيار المحرر')}</span>
            </div>
            <div
              onClick={() => setSelectedOffer(featuredOffer)}
              className="group relative rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-all duration-300"
            >
              <div className="aspect-[21/7] sm:aspect-[21/6] relative">
                <img src={featuredOffer.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center p-6 sm:p-8">
                  <div className="max-w-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-500 text-white font-black text-base px-3 py-1.5 rounded-md">
                        -{Math.round(Number(featuredOffer.discountPercent))}% OFF
                      </span>
                      <span className="text-white/80 text-sm font-medium">{featuredOffer.categoryEn}</span>
                    </div>
                    <h3 className="text-white font-bold text-xl sm:text-2xl leading-snug mb-2 tracking-[-0.02em]">
                      {lang === 'ar' ? featuredOffer.titleAr : featuredOffer.titleEn}
                    </h3>
                    <p className="text-white/70 text-sm mb-4 hidden sm:block line-clamp-2">
                      {lang === 'ar' ? featuredOffer.descriptionAr : featuredOffer.descriptionEn}
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white/60 text-xs line-through">{featuredOffer.currency} {featuredOffer.originalPrice}</p>
                        <p className="text-white font-black text-2xl leading-none">{featuredOffer.currency} {featuredOffer.discountedPrice}</p>
                      </div>
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 group-hover:bg-white/30 transition-colors">
                        {t('Get Deal', 'احصل على العرض')} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-[-0.02em]">
              {search ? t(`Results for "${search}"`, `نتائج "${search}"`) : t('All Deals', 'كل العروض')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} {t('deals available', 'عرض متاح')}
            </p>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(offer => (
              <DealCard key={offer.id} offer={offer} onSelect={() => setSelectedOffer(offer)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">{t('No deals found', 'لم يتم إيجاد عروض')}</p>
            <p className="text-sm text-muted-foreground">{t('Try adjusting your filters', 'حاول تعديل الفلاتر')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
