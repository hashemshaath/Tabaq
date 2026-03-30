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
  Ticket, Percent, AlertCircle, Users, BadgeCheck, QrCode, Check,
  Navigation, Award, Sparkles, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { StarRating } from '@/components/StarRating';

// ─── Types ────────────────────────────────────────────────────────
interface OfferTier {
  id: string;
  labelEn: string;
  labelAr: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  promoPrice: number;
  promoCode: string;
  boughtCount: number;
}

// ─── Mock offers ─────────────────────────────────────────────────
const MOCK_OFFERS = [
  {
    id: 9001,
    titleEn: 'Voucher Worth SAR 100, 200, 300 or 500 to Spend on Anything Off Menu',
    titleAr: 'قسيمة بقيمة 100 أو 200 أو 300 أو 500 ريال لإنفاقها على أي شيء من القائمة',
    descriptionEn: 'Indulge in the finest traditional Saudi cuisine at Najd Village — Saudi Arabia\'s most celebrated heritage restaurant. Established 1996. Savor authentic kabsa, mandi, jareesh, mutabbaq and more in an immersive palace setting with live oud music.',
    descriptionAr: 'استمتع بأرقى المطبخ السعودي التقليدي في قرية نجد — أشهر مطعم تراثي في المملكة. يُقدم أشهى الكبسة والمندي والجريش والمطبق في أجواء قصر تراثي مع موسيقى العود.',
    restaurantId: 1, restaurantNameEn: 'Najd Village', restaurantNameAr: 'قرية نجد',
    locationsCount: 3,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=900&h=600&fit=crop',
    ],
    discountPercent: '40', originalPrice: '200', discountedPrice: '120', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
    remainingCapacity: 18, boughtCount: 234,
    categoryEn: 'Saudi Cuisine', city: 'Riyadh',
    address: 'Al Hamra District - Olaya St · next to Hilton',
    distanceKm: 3.9,
    rating: 4.8, reviews: 342,
    badges: ['Best Rated', 'Popular Gift'],
    highlights: ['Authentic Saudi Cuisine', 'Heritage Palace Setting', 'Live Oud Music', 'Valid Any Day'],
    needToKnow: ['Advance booking required 24 hours before', 'Not valid with any other offer', 'Non-refundable once purchased', 'Valid 60 days from purchase date', 'Show voucher to staff on arrival'],
    whereToRedeem: 'Al Hamra District, Riyadh 12943. Show voucher code to the restaurant staff upon arrival.',
    termsEn: 'Valid for the number of guests specified. Advance booking required 24 hours before. Not valid with any other offer. Non-refundable once purchased.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 60 and get a voucher worth SAR 100 to spend on anything off the menu', labelAr: 'ادفع 60 ريالاً واحصل على قسيمة بقيمة 100 ريال', originalPrice: 100, discountedPrice: 60, discountPercent: 40, promoPrice: 54, promoCode: 'TABAQ10', boughtCount: 234 },
      { id: 't2', labelEn: 'Pay SAR 119 and get a voucher worth SAR 200 to spend on anything off the menu', labelAr: 'ادفع 119 ريالاً واحصل على قسيمة بقيمة 200 ريال', originalPrice: 200, discountedPrice: 119, discountPercent: 41, promoPrice: 107, promoCode: 'TABAQ10', boughtCount: 89 },
      { id: 't3', labelEn: 'Pay SAR 179 and get a voucher worth SAR 300 to spend on anything off the menu', labelAr: 'ادفع 179 ريالاً واحصل على قسيمة بقيمة 300 ريال', originalPrice: 300, discountedPrice: 179, discountPercent: 40, promoPrice: 161, promoCode: 'TABAQ10', boughtCount: 56 },
      { id: 't4', labelEn: 'Pay SAR 295 and get a voucher worth SAR 500 to spend on anything off the menu', labelAr: 'ادفع 295 ريالاً واحصل على قسيمة بقيمة 500 ريال', originalPrice: 500, discountedPrice: 295, discountPercent: 41, promoPrice: 266, promoCode: 'TABAQ10', boughtCount: 31 },
    ] as OfferTier[],
  },
  {
    id: 9002,
    titleEn: 'Premium Omakase Dinner Experience — 12 Chef-Curated Courses',
    titleAr: 'تجربة عشاء أوماكاسي مميزة — 12 طبقاً من اختيار الشيف',
    descriptionEn: 'Experience the finest Japanese Omakase at Sushi Sama. The chef curates 12 seasonal courses using the freshest daily imported fish. A truly unmissable culinary journey that showcases the art of Japanese precision.',
    descriptionAr: 'اختبر أرقى الأوماكاسي الياباني في سوشي ساما. يختار الشيف 12 طبقاً موسمياً يومياً من أطازج الأسماك المستوردة.',
    restaurantId: 3, restaurantNameEn: 'Sushi Sama', restaurantNameAr: 'سوشي ساما',
    locationsCount: 2,
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=900&h=600&fit=crop',
    ],
    discountPercent: '40', originalPrice: '650', discountedPrice: '390', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 12 * 86400000).toISOString(),
    remainingCapacity: 6, boughtCount: 89,
    categoryEn: 'Japanese', city: 'Riyadh',
    address: 'Olaya Street, Riyadh 12611',
    distanceKm: 5.2,
    rating: 4.9, reviews: 187,
    badges: ['Best Rated'],
    highlights: ['12 Seasonal Courses', "Chef's Selection Daily", 'Sake Pairing Add-on', 'Private Counter Seating'],
    needToKnow: ['Booking required 48 hours in advance', 'Allergies must be communicated at time of booking', 'Valid Mon–Sat evenings only', 'Single diner per voucher'],
    whereToRedeem: 'Olaya Street, Riyadh 12611. Counter seating — show voucher on arrival.',
    termsEn: 'Valid for 1 person. Booking required 48 hours in advance. Valid Mon–Sat evenings only.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 390 and get a full Omakase dinner (12 courses)', labelAr: 'ادفع 390 ريالاً واحصل على عشاء أوماكاسي كامل', originalPrice: 650, discountedPrice: 390, discountPercent: 40, promoPrice: 351, promoCode: 'TABAQ10', boughtCount: 89 },
    ] as OfferTier[],
  },
  {
    id: 9003,
    titleEn: 'Luxury Afternoon Tea for Two — 3-Tier Pastry Stand & Premium Teas',
    titleAr: 'شاي ما بعد الظهر الفاخر لشخصين — طقم معجنات 3 طبقات وشاي مميز',
    descriptionEn: 'Enjoy a luxurious Afternoon Tea service at The Terrace featuring 3 tiers of freshly baked pastries, finger sandwiches, house-made scones, and unlimited premium teas and coffees with stunning city views.',
    descriptionAr: 'استمتع بخدمة شاي ما بعد الظهر الفاخرة في التيراس مع 3 طوابق من المعجنات الطازجة.',
    restaurantId: 5, restaurantNameEn: 'The Terrace', restaurantNameAr: 'التيراس',
    locationsCount: 1,
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=900&h=600&fit=crop'],
    discountPercent: '35', originalPrice: '280', discountedPrice: '182', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 21 * 86400000).toISOString(),
    remainingCapacity: 35, boughtCount: 412,
    categoryEn: 'Café', city: 'Riyadh',
    address: 'Kingdom Tower, King Fahd Road, Riyadh',
    distanceKm: 2.1,
    rating: 4.6, reviews: 94,
    badges: ['Popular Gift'],
    highlights: ['3-Tier Pastry Stand', 'Unlimited Tea & Coffee', 'Valid Weekends', 'City View Seating'],
    needToKnow: ['Valid for 2 guests', 'Minimum age 12', 'Not valid on public holidays', 'Booking required 12 hours in advance'],
    whereToRedeem: 'Kingdom Tower, Riyadh 12214. Show voucher at reception.',
    termsEn: 'Valid for 2 guests. Minimum age 12. Not valid on public holidays.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 182 and get Afternoon Tea for Two (full service)', labelAr: 'ادفع 182 ريالاً واحصل على شاي العصر لشخصين', originalPrice: 280, discountedPrice: 182, discountPercent: 35, promoPrice: 164, promoCode: 'TABAQ10', boughtCount: 412 },
    ] as OfferTier[],
  },
  {
    id: 9004,
    titleEn: 'Friday BBQ Brunch Buffet — Unlimited Grills & Saudi Specialties',
    titleAr: 'بوفيه شواء الجمعة — مشويات لا محدودة وأطباق سعودية',
    descriptionEn: 'Feast on an unlimited BBQ brunch at Reem Al Bawadi every Friday. Featuring live grill stations, traditional Saudi dishes, international spreads, fresh juices, and decadent dessert stations.',
    descriptionAr: 'استمتع ببوفيه شواء لا محدود كل جمعة في ريم البوادي مع محطات شواء حية.',
    restaurantId: 2, restaurantNameEn: 'Reem Al Bawadi', restaurantNameAr: 'ريم البوادي',
    locationsCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&h=600&fit=crop', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop'],
    discountPercent: '30', originalPrice: '240', discountedPrice: '168', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    remainingCapacity: 50, boughtCount: 678,
    categoryEn: 'Saudi Cuisine', city: 'Riyadh',
    address: 'Al Aqiq District, Prince Mohammed Bin Salman Rd',
    distanceKm: 7.3,
    rating: 4.5, reviews: 218,
    badges: ['Popular Gift'],
    highlights: ['Unlimited Buffet', 'Live Grill Station', 'Fresh Juice Bar', 'Kids Eat Free Under 5'],
    needToKnow: ['Valid Fridays only, 12PM–4PM', 'Maximum 1 voucher per person per visit', 'Kids under 5 eat free'],
    whereToRedeem: 'Al Aqiq District, Riyadh 13522. Show voucher upon entry.',
    termsEn: 'Valid Fridays only. Maximum 1 voucher per person per visit.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 168 and get Unlimited BBQ Brunch Buffet for One', labelAr: 'ادفع 168 ريالاً واحصل على بوفيه شواء لشخص واحد', originalPrice: 240, discountedPrice: 168, discountPercent: 30, promoPrice: 151, promoCode: 'TABAQ10', boughtCount: 678 },
    ] as OfferTier[],
  },
  {
    id: 9005,
    titleEn: 'Premium Business Lunch — 3-Course Set Menu at Hakkasan',
    titleAr: 'غداء الأعمال المميز — قائمة مكونة من 3 أطباق في هاكاسان',
    descriptionEn: 'A premium 3-course business lunch at Hakkasan. Starter, signature main course, and dessert with choice of soft drink or Chinese tea. Perfect for corporate dining.',
    descriptionAr: 'غداء أعمال فاخر مكون من 3 أطباق في هاكاسان مع مشروب من اختيارك.',
    restaurantId: 5, restaurantNameEn: 'Hakkasan', restaurantNameAr: 'هاكاسان',
    locationsCount: 1,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=600&fit=crop'],
    discountPercent: '45', originalPrice: '320', discountedPrice: '176', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 8 * 86400000).toISOString(),
    remainingCapacity: 12, boughtCount: 156,
    categoryEn: 'Chinese', city: 'Riyadh',
    address: 'Rosewood Hotel, King Fahd Rd, Riyadh',
    distanceKm: 4.7,
    rating: 4.7, reviews: 289,
    badges: ['Best Rated'],
    highlights: ['3-Course Set Lunch', 'Weekdays Only', 'Includes Soft Drink', 'Private Room Available'],
    needToKnow: ['Valid Mon–Thu lunch service 12PM–3PM', 'Single diner only', 'Receipt required for redemption'],
    whereToRedeem: 'Rosewood Hotel, Riyadh 12261. Show voucher to the host.',
    termsEn: 'Valid Mon–Thu lunch service 12PM–3PM. Single diner only.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 176 and get a 3-Course Business Lunch for One', labelAr: 'ادفع 176 ريالاً واحصل على غداء أعمال لشخص واحد', originalPrice: 320, discountedPrice: 176, discountPercent: 45, promoPrice: 158, promoCode: 'TABAQ10', boughtCount: 156 },
    ] as OfferTier[],
  },
  {
    id: 9006,
    titleEn: 'Family Feast for 4 — Mains, Sides & Shared Dessert Platter',
    titleAr: 'وجبة العائلة لـ4 أشخاص — وجبات رئيسية وأطباق جانبية وحلوى مشتركة',
    descriptionEn: 'Bring the whole family for a feast at Burger & Lobster Jeddah. Includes 4 mains, 4 sides, 4 soft drinks, and a shared dessert platter.',
    descriptionAr: 'أحضر عائلتك لوجبة رائعة في برجر ولوبستر جدة تشمل 4 وجبات رئيسية ومشروبات وحلوى مشتركة.',
    restaurantId: 4, restaurantNameEn: 'Burger & Lobster', restaurantNameAr: 'برجر ولوبستر',
    locationsCount: 2,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=600&fit=crop'],
    discountPercent: '25', originalPrice: '440', discountedPrice: '330', currency: 'SAR',
    promoCode: 'TABAQ10',
    validUntil: new Date(Date.now() + 45 * 86400000).toISOString(),
    remainingCapacity: 75, boughtCount: 321,
    categoryEn: 'American', city: 'Jeddah',
    address: 'Al Rawdah District, Jeddah Corniche',
    distanceKm: 1.8,
    rating: 4.2, reviews: 156,
    badges: [],
    highlights: ['4 Mains Included', '4 Sides Included', 'Shared Dessert', 'Kids Menu Available'],
    needToKnow: ['Valid for exactly 4 guests', 'Not valid on Fridays', 'Booking required 24 hours in advance'],
    whereToRedeem: 'Al Rawdah, Jeddah 23432. Show voucher at the door.',
    termsEn: 'Valid for exactly 4 guests. Not valid on Fridays.',
    tiers: [
      { id: 't1', labelEn: 'Pay SAR 330 and get the Full Family Feast for 4', labelAr: 'ادفع 330 ريالاً واحصل على وجبة العائلة الكاملة لـ4', originalPrice: 440, discountedPrice: 330, discountPercent: 25, promoPrice: 297, promoCode: 'TABAQ10', boughtCount: 321 },
    ] as OfferTier[],
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

// ─── Countdown Timer ──────────────────────────────────────────────
function Countdown({ until }: { until: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) return;
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [until]);
  return (
    <span className="font-mono font-bold text-foreground">
      {parts.d > 0 ? `${parts.d} day${parts.d !== 1 ? 's' : ''} ` : ''}
      {String(parts.h).padStart(2, '0')}:{String(parts.m).padStart(2, '0')}:{String(parts.s).padStart(2, '0')}
    </span>
  );
}

// ─── Star Row ─────────────────────────────────────────────────────
function StarRow({ rating, reviews, size = 'sm' }: { rating: number; reviews: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-1">
      <StarRating rating={rating} size={size === 'md' ? 'lg' : 'md'} />
      <span className={`font-bold text-foreground ms-0.5 ${size === 'md' ? 'text-sm' : 'text-xs'}`}>{rating}</span>
      <span className={`text-muted-foreground ${size === 'md' ? 'text-sm' : 'text-xs'}`}>({reviews})</span>
    </div>
  );
}

// ─── QR Code Display ──────────────────────────────────────────────
function QRCodeDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const size = 160; c.width = size; c.height = size;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    const seed = code.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const cells = 21; const cellSize = size / cells;
    for (let r = 0; r < cells; r++) {
      for (let col = 0; col < cells; col++) {
        const isCorner = (r < 7 && col < 7) || (r < 7 && col >= cells - 7) || (r >= cells - 7 && col < 7);
        if (isCorner) {
          const inInner2 = (r >= 2 && r <= 4 && col >= 2 && col <= 4) || (r >= 2 && r <= 4 && col >= cells - 5 && col <= cells - 3) || (r >= cells - 5 && r <= cells - 3 && col >= 2 && col <= 4);
          const inInner = (r >= 1 && r <= 5 && col >= 1 && col <= 5) || (r >= 1 && r <= 5 && col >= cells - 6 && col <= cells - 2) || (r >= cells - 6 && r <= cells - 2 && col >= 1 && col <= 5);
          ctx.fillStyle = inInner2 ? '#111' : inInner ? '#fff' : '#111';
          ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = '#111';
          const hash = (seed * (r * cells + col + 1) * 2654435761) >>> 0;
          if (hash % 2 === 0) ctx.fillRect(col * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [code]);
  return <canvas ref={canvasRef} className="rounded-md" style={{ width: 160, height: 160 }} />;
}

// ─── Deal Card (Groupon style) ────────────────────────────────────
function DealCard({ offer, onSelect }: { offer: ExtendedOffer; onSelect: () => void }) {
  const { t, lang } = useLanguage();
  const [wishlisted, setWishlisted] = useState(false);
  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const isSoldOut = (offer.remainingCapacity ?? 1) <= 0;
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10 && !isSoldOut;
  const daysLeft = Math.floor((new Date(offer.validUntil).getTime() - Date.now()) / 86400000);

  const firstTier = offer.tiers?.[0];
  const displayOriginal = firstTier ? firstTier.originalPrice : Number(offer.originalPrice);
  const displayDiscounted = firstTier ? firstTier.discountedPrice : Number(offer.discountedPrice);
  const displayPromo = firstTier ? firstTier.promoPrice : Math.round(displayDiscounted * 0.9);
  const displayBadge = firstTier ? firstTier.discountPercent : Math.round(Number(offer.discountPercent));
  const promoCodeDisplay = firstTier?.promoCode ?? offer.promoCode ?? 'TABAQ10';

  return (
    <div
      onClick={!isSoldOut ? onSelect : undefined}
      className={`group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isSoldOut ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
        <img
          src={offer.imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        {/* Wishlist */}
        <button
          onClick={e => { e.stopPropagation(); setWishlisted(w => !w); }}
          className={`absolute top-2.5 end-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? 'bg-red-500' : 'bg-white/90 hover:bg-white'}`}
        >
          <Heart className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-white text-white' : 'text-gray-500'}`} />
        </button>
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="bg-black/90 text-white font-bold px-4 py-2 rounded-lg text-sm">{t('Sold Out', 'نفدت')}</span>
          </div>
        )}
        {/* Urgency or ending soon */}
        {(isUrgent || daysLeft <= 3) && !isSoldOut && (
          <div className="absolute bottom-2.5 start-2.5">
            <span className={`text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow ${isUrgent ? 'bg-red-500' : 'bg-amber-500'}`}>
              {isUrgent ? <Flame className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isUrgent ? `${offer.remainingCapacity} ${t('left', 'متبقٍ')}` : timeUntil(offer.validUntil, lang)}
            </span>
          </div>
        )}
      </div>

      {/* Info below image — Groupon style */}
      <div className="p-3.5">
        {/* Restaurant name + locations */}
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-sm text-foreground font-medium truncate">{restName}</p>
          {(offer.locationsCount ?? 1) > 1 && (
            <span className="text-xs text-muted-foreground shrink-0">({offer.locationsCount} {t('Locations', 'فروع')})</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-2">{title}</h3>

        {/* Address + distance */}
        {(offer.address || offer.city) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{offer.address || offer.city}</span>
            {offer.distanceKm && (
              <>
                <span className="shrink-0 mx-0.5">·</span>
                <Navigation className="w-3 h-3 shrink-0" />
                <span className="shrink-0">{offer.distanceKm} km</span>
              </>
            )}
          </div>
        )}

        {/* Stars */}
        <div className="mb-2.5">
          <StarRow rating={offer.rating} reviews={offer.reviews} />
        </div>

        {/* Price row 1: strikethrough + discounted + green badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground line-through">{offer.currency}{displayOriginal}</span>
          <span className="text-sm font-bold text-foreground">{offer.currency}{displayDiscounted}</span>
          <span className="text-[11px] font-bold text-white bg-[#2e7d32] px-1.5 py-0.5 rounded">-{displayBadge}%</span>
        </div>

        {/* Price row 2: promo price with code */}
        <div className="flex items-center gap-1.5">
          <span className="text-base font-black text-foreground">{offer.currency}{displayPromo}</span>
          <span className="text-xs text-muted-foreground">{t('with code', 'بكود')}</span>
          <code className="text-xs font-bold text-primary">{promoCodeDisplay}</code>
        </div>
      </div>
    </div>
  );
}

// ─── Deal Detail (Groupon style two-column) ───────────────────────
function DealDetailPage({ offer, onBack }: { offer: ExtendedOffer; onBack: () => void }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const topRef = useRef<HTMLDivElement>(null);

  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'about' | 'needtoknow' | 'where' | 'reviews'>('about');
  const [selectedTier, setSelectedTier] = useState(0);
  const [qty, setQty] = useState(1);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'qr' | 'barcode'>('qr');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountAmt, setPromoDiscountAmt] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'stc_pay'>('card');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isMock = offer.id >= 9000;
  const mockCode = `TBQ-${offer.id.toString(36).toUpperCase()}-${String(offer.id * 7 % 9999).padStart(4, '0')}`;

  const tiers: OfferTier[] = offer.tiers ?? [{
    id: 't1',
    labelEn: `Pay ${offer.currency} ${offer.discountedPrice} and get a voucher worth ${offer.currency} ${offer.originalPrice}`,
    labelAr: `ادفع ${offer.discountedPrice} واحصل على قسيمة بقيمة ${offer.originalPrice}`,
    originalPrice: Number(offer.originalPrice),
    discountedPrice: Number(offer.discountedPrice),
    discountPercent: Number(offer.discountPercent),
    promoPrice: Math.round(Number(offer.discountedPrice) * 0.9),
    promoCode: offer.promoCode ?? 'TABAQ10',
    boughtCount: offer.boughtCount ?? 0,
  }];

  const tier = tiers[selectedTier];
  const subtotal = tier.discountedPrice * qty;
  const promoSaving = appliedPromo ? promoDiscountAmt : 0;
  const totalPrice = Math.max(0, subtotal - promoSaving);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    const VALID_CODES: Record<string, number> = { 'TABAQ10': 10, 'SAVE15': 15, 'NEWUSER20': 20 };
    const code = promoInput.trim().toUpperCase();
    setTimeout(() => {
      const pct = VALID_CODES[code];
      if (pct) {
        setAppliedPromo(code);
        setPromoDiscountAmt(Math.round(subtotal * pct / 100));
        setPromoError(null);
      } else {
        setPromoError(t('Invalid promo code. Try TABAQ10.', 'رمز خاطئ. جرب TABAQ10.'));
      }
      setPromoLoading(false);
    }, 600);
  };
  const clearPromo = () => { setAppliedPromo(null); setPromoDiscountAmt(0); setPromoInput(''); setPromoError(null); };

  const giftVoucher = useGiftVoucher();
  const purchaseVoucher = usePurchaseVoucher({
    mutation: {
      onSuccess: (data: any) => {
        if (giftMode && (recipientPhone || recipientEmail)) {
          giftVoucher.mutate(
            { voucherId: data.id, data: { recipientPhone: recipientPhone || undefined, recipientEmail: recipientEmail || undefined, giftMessage: giftMessage || undefined } },
            {
              onSuccess: () => { setVoucherCode(data.code); queryClient.invalidateQueries({ queryKey: ['vouchers'] }); },
              onError: () => setVoucherCode(data.code),
            }
          );
        } else {
          setVoucherCode(data.code);
          queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        }
      },
    },
  });

  const displayCode = voucherCode || (isMock && purchaseVoucher.isSuccess ? mockCode : null);
  const isPurchased = !!displayCode;
  const isUrgent = (offer.remainingCapacity ?? 99) <= 10 && (offer.remainingCapacity ?? 1) > 0;

  const title = lang === 'ar' ? offer.titleAr : offer.titleEn;
  const desc = lang === 'ar' ? offer.descriptionAr : offer.descriptionEn;
  const restName = lang === 'ar' ? offer.restaurantNameAr : offer.restaurantNameEn;
  const images = offer.images?.length ? offer.images : [offer.imageUrl];
  const shareUrl = window.location.href;

  const copyCode = () => {
    navigator.clipboard.writeText(displayCode!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const handleBuy = () => {
    if (isMock) { setVoucherCode(mockCode); return; }
    if (!user) return;
    purchaseVoucher.mutate({
      data: {
        offerId: offer.id,
        currency: offer.currency,
        giftMode,
        giftRecipientPhone: recipientPhone || undefined,
        giftRecipientEmail: recipientEmail || undefined,
        giftMessage: giftMessage || undefined,
      } as any,
    });
  };

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  const tabsDef = [
    { key: 'about' as const, en: 'About', ar: 'عن العرض' },
    { key: 'needtoknow' as const, en: 'Need To Know Info', ar: 'ما تحتاج معرفته' },
    { key: 'where' as const, en: 'Where To Redeem', ar: 'أين يتم الاسترداد' },
    { key: 'reviews' as const, en: 'Reviews', ar: 'التقييمات' },
  ];

  return (
    <div ref={topRef} className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Back nav */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Deals', 'العودة للعروض')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug tracking-[-0.025em] mb-4">{title}</h1>

            {/* Restaurant + address + rating */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-muted-foreground shrink-0" />
                <Link href={`/restaurants/${offer.restaurantId}`} className="font-semibold text-foreground hover:text-primary transition-colors">{restName}</Link>
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{offer.address || offer.city}</span>
                {(offer.locationsCount ?? 1) > 1 && (
                  <span className="text-primary font-medium ms-1">+ {(offer.locationsCount ?? 1) - 1} {t('locations', 'فروع')}</span>
                )}
              </div>
              <StarRow rating={offer.rating} reviews={offer.reviews} size="md" />
            </div>

            {/* Badges */}
            {offer.badges && offer.badges.length > 0 && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {offer.badges.map((b: string) => (
                  <span key={b} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    b === 'Best Rated' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                  }`}>
                    {b === 'Best Rated' ? <Award className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {lang === 'ar' ? (b === 'Best Rated' ? 'الأعلى تقييماً' : 'هدية رائجة') : b}
                  </span>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="relative rounded-xl overflow-hidden bg-muted mb-3 shadow-sm" style={{ aspectRatio: '16/9' }}>
              <img src={images[activeImg]} alt={title} className="w-full h-full object-cover" />
              <div className="absolute top-3 end-3 flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShareOpen(o => !o)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <Share2 className="w-4 h-4 text-foreground" />
                  </button>
                  {shareOpen && (
                    <div className="absolute end-0 top-11 bg-card border border-border rounded-xl shadow-xl p-3 w-48 z-50">
                      {[
                        { label: 'Copy link', icon: Copy, action: () => { navigator.clipboard.writeText(shareUrl).catch(() => {}); setShareOpen(false); } },
                        { label: 'WhatsApp', icon: MessageSquare, action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`); setShareOpen(false); } },
                        { label: 'X / Twitter', icon: ExternalLink, action: () => { window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`); setShareOpen(false); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
                          <item.icon className="w-4 h-4 text-muted-foreground" />{item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setSaved(s => !s)} className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition-all ${saved ? 'bg-red-500' : 'bg-white/90 hover:bg-white'}`}>
                  <Heart className={`w-4 h-4 ${saved ? 'fill-white text-white' : 'text-foreground'}`} />
                </button>
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

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImg === i ? 'border-foreground' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-border mb-6 overflow-x-auto">
              <div className="flex gap-0 min-w-max">
                {tabsDef.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lang === 'ar' ? tab.ar : tab.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                {offer.highlights?.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-foreground mb-3">{t("What's included", 'ما يتضمنه العرض')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {offer.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'needtoknow' && (
              <div className="space-y-3">
                {(offer.needToKnow?.length ? offer.needToKnow : [offer.termsEn]).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'where' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-secondary/40 rounded-xl p-4">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-0.5">{restName}</p>
                    <p className="text-sm text-muted-foreground">{offer.whereToRedeem ?? offer.address ?? offer.city}</p>
                  </div>
                </div>
                {(offer.locationsCount ?? 1) > 1 && (
                  <p className="text-sm text-primary font-medium">+ {(offer.locationsCount ?? 1) - 1} {t('additional locations', 'فرع إضافي')}</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center gap-6 bg-secondary/30 rounded-xl p-5">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-black text-foreground">{offer.rating}</p>
                    <StarRow rating={offer.rating} reviews={offer.reviews} />
                  </div>
                  <div className="flex-1">
                    {[5,4,3,2,1].map(s => {
                      const pct = s === 5 ? 65 : s === 4 ? 25 : s === 3 ? 7 : s === 2 ? 2 : 1;
                      return (
                        <div key={s} className="flex items-center gap-2 mb-1">
                          <span className="text-xs w-3 text-muted-foreground">{s}</span>
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-6">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('Be the first to review after your visit!', 'كن أول من يقيّم بعد زيارتك!')}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (Sidebar) ── */}
          <div className="lg:sticky lg:top-24 self-start space-y-4">

            {isPurchased ? (
              /* Redemption card */
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-emerald-500 px-5 py-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-bold text-base">{t('Voucher Activated!', 'تم تفعيل الكوبون!')}</p>
                  </div>
                  <p className="text-emerald-100 text-sm">{t('Show this at the restaurant', 'اعرض هذا في المطعم')}</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                    {(['qr', 'barcode'] as const).map(mode => (
                      <button key={mode} onClick={() => setViewTab(mode)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-md transition-all ${viewTab === mode ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                        {mode === 'qr' ? <QrCode className="w-3.5 h-3.5" /> : <ScanLine className="w-3.5 h-3.5" />}
                        {mode === 'qr' ? 'QR Code' : 'Barcode'}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <QRCodeDisplay code={displayCode!} />
                  </div>
                  <div className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
                    <code className="text-sm font-mono font-bold text-foreground flex-1 text-center tracking-wider select-all">{displayCode}</code>
                    <button onClick={copyCode} className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      {t('Tabaq Buyer Protection', 'حماية المشتري')}
                    </div>
                    <Link href="/vouchers" className="font-semibold text-primary hover:underline">{t('My Vouchers →', 'قسائمي →')}</Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Promo hint banner */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <Percent className="w-4 h-4 text-violet-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-violet-800">{t('Have a promo code?', 'لديك كود خصم؟')}</p>
                    <p className="text-[11px] text-violet-600">{t('Add it at checkout for extra savings', 'أضفه للحصول على خصم إضافي')}</p>
                  </div>
                  <Countdown until={offer.validUntil} />
                </div>

                {/* Option selector card */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
                    <p className="text-sm font-bold text-foreground">{t('Select Option:', 'اختر الخيار:')}</p>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={giftMode}
                        onChange={e => setGiftMode(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="text-xs font-semibold text-foreground">{t('Buy As a Gift', 'شراء كهدية')}</span>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </label>
                  </div>

                  {/* Tier options */}
                  <div className="p-4 space-y-3">
                    {tiers.map((tier2, i) => {
                      const isSelected = selectedTier === i;
                      return (
                        <div
                          key={tier2.id}
                          onClick={() => { setSelectedTier(i); clearPromo(); }}
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Radio */}
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary' : 'border-muted-foreground/40'}`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-snug mb-2">
                                {lang === 'ar' ? tier2.labelAr : tier2.labelEn}
                              </p>
                              {/* Pricing */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-muted-foreground line-through">{offer.currency}{tier2.originalPrice}</span>
                                <span className="text-sm font-bold text-foreground">{offer.currency}{tier2.discountedPrice}</span>
                                <span className="text-[11px] font-bold text-white bg-[#2e7d32] px-1.5 py-0.5 rounded">-{tier2.discountPercent}%</span>
                              </div>
                              {/* Qty + social proof */}
                              {isSelected && (
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                                    <button onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }} className="px-2.5 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40 text-foreground" disabled={qty <= 1}>
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-3 text-sm font-bold text-foreground">{qty}</span>
                                    <button onClick={e => { e.stopPropagation(); setQty(q => Math.min(10, q + 1)); }} className="px-2.5 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40 text-foreground" disabled={qty >= 10}>
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{tier2.boughtCount}+ {t('bought', 'اشترى')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gift fields */}
                  {giftMode && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border/60 pt-4">
                      <p className="text-xs font-semibold text-foreground mb-2">{t("Recipient's details", 'تفاصيل المستلم')}</p>
                      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder={t('Phone number', 'رقم الهاتف')} className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder={t('Email (optional)', 'البريد الإلكتروني')} className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground" />
                      </div>
                      <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder={t('Personal message (optional)', 'رسالة شخصية')} rows={2} className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground resize-none" />
                    </div>
                  )}

                  {/* Urgency */}
                  {isUrgent && (
                    <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      {t('This item is selling fast, so act now!', 'هذا العرض ينفد بسرعة، تصرف الآن!')}
                    </div>
                  )}

                  {/* Promo Code Input */}
                  <div className="px-4 pb-3 border-t border-border/60 pt-4">
                    <p className="text-xs font-semibold text-foreground mb-2">{t('Promo Code', 'كود الخصم')}</p>
                    {appliedPromo ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-bold text-emerald-700 flex-1">
                          {appliedPromo} — {t('Saving', 'توفير')} {offer.currency} {promoSaving}
                        </span>
                        <button onClick={clearPromo} className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={promoInput}
                          onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                          placeholder={t('Enter code (e.g. TABAQ10)', 'أدخل الكود')}
                          className="flex-1 text-sm bg-secondary/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder:font-sans"
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={!promoInput.trim() || promoLoading}
                          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 transition-all hover:bg-primary/90 shrink-0"
                        >
                          {promoLoading ? '...' : t('Apply', 'تطبيق')}
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {promoError}
                      </p>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="px-4 pb-3 space-y-2 border-t border-border/60 pt-3">
                    <p className="text-xs font-semibold text-foreground mb-2">{t('Order Summary', 'ملخص الطلب')}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('Subtotal', 'المجموع الفرعي')} {qty > 1 ? `(×${qty})` : ''}</span>
                      <span className="font-semibold text-foreground">{offer.currency} {subtotal}</span>
                    </div>
                    {promoSaving > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600">{t('Promo Discount', 'خصم الكود')}</span>
                        <span className="font-semibold text-emerald-600">− {offer.currency} {promoSaving}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-sm font-bold text-foreground">{t('Total', 'الإجمالي')}</span>
                      <span className="text-lg font-black text-foreground">{offer.currency} {totalPrice}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="px-4 pb-3 space-y-2 border-t border-border/60 pt-3">
                    <p className="text-xs font-semibold text-foreground mb-2">{t('Payment Method', 'طريقة الدفع')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'card', labelEn: 'Credit Card', labelAr: 'بطاقة', icon: '💳' },
                        { id: 'apple_pay', labelEn: 'Apple Pay', labelAr: 'Apple Pay', icon: '' },
                        { id: 'stc_pay', labelEn: 'STC Pay', labelAr: 'STC Pay', icon: '📱' },
                      ] as const).map(pm => (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all ${
                            paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <span className="text-base">{pm.icon || '🍎'}</span>
                          <span className="text-[10px] font-semibold text-foreground leading-tight">{lang === 'ar' ? pm.labelAr : pm.labelEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terms + Buy Now */}
                  <div className="px-4 pb-5 pt-3 border-t border-border/60 space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                        {t('I agree to the ', 'أوافق على ')}
                        <Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">{t('Terms & Conditions', 'الشروط والأحكام')}</Link>
                        {t(' and confirm this purchase is non-refundable once processed.', ' وأؤكد أن هذا الشراء غير قابل للاسترداد بعد المعالجة.')}
                      </span>
                    </label>
                    {!user ? (
                      <Link href="/signin" className="block">
                        <button className="w-full bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold py-3.5 rounded-xl transition-colors text-base shadow">
                          {t('Sign in to Buy Now', 'سجّل دخولك للشراء')}
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={handleBuy}
                        disabled={purchaseVoucher.isPending || !termsAccepted}
                        className="w-full bg-[#1b5e20] hover:bg-[#2e7d32] text-white font-bold py-3.5 rounded-xl transition-colors text-base shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchaseVoucher.isPending
                          ? t('Processing...', 'جارٍ المعالجة...')
                          : `${t('Complete Purchase', 'إتمام الشراء')} · ${offer.currency} ${totalPrice}`}
                      </button>
                    )}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      {t('Secure checkout · Tabaq Buyer Protection', 'دفع آمن · حماية المشتري من طبق')}
                    </div>
                  </div>
                </div>
              </>
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
  const { data: rawApiOffers, isLoading: offersLoading } = useListOffers({});
  const apiOffers = Array.isArray(rawApiOffers) ? rawApiOffers : (rawApiOffers as any)?.offers ?? (rawApiOffers as any)?.data ?? [];
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('Best Match');
  const [search, setSearch] = useState('');

  const allOffers = useMemo<ExtendedOffer[]>(() => {
    const api: ExtendedOffer[] = (apiOffers ?? []).map((o: any) => ({
      id: o.id,
      titleEn: o.titleEn, titleAr: o.titleAr,
      descriptionEn: o.descriptionEn ?? '', descriptionAr: o.descriptionAr ?? '',
      restaurantId: o.restaurantId,
      restaurantNameEn: o.restaurantNameEn ?? 'Restaurant', restaurantNameAr: o.restaurantNameAr ?? 'مطعم',
      imageUrl: o.imageUrl ?? o.restaurantCoverImageUrl ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop',
      images: [o.imageUrl ?? o.restaurantCoverImageUrl ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=600&fit=crop'],
      discountPercent: String(o.discountPercent ?? 20),
      originalPrice: String(o.originalPrice ?? 200),
      discountedPrice: String(o.discountedPrice ?? 160),
      currency: o.currency ?? 'SAR',
      promoCode: 'TABAQ10',
      validUntil: o.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString(),
      remainingCapacity: o.remainingCapacity ?? 50,
      boughtCount: o.boughtCount ?? 0,
      categoryEn: 'Restaurant', city: 'Riyadh',
      address: '', distanceKm: undefined, locationsCount: 1,
      rating: 4.7, reviews: 50, badges: [], highlights: [], needToKnow: [], whereToRedeem: '',
      termsEn: 'Valid as described.',
      tiers: [{
        id: 't1',
        labelEn: `Pay ${o.currency ?? 'SAR'} ${Number(o.discountedPrice ?? 160)} and get a voucher worth ${o.currency ?? 'SAR'} ${Number(o.originalPrice ?? 200)}`,
        labelAr: `ادفع ${Number(o.discountedPrice ?? 160)} واحصل على قسيمة بقيمة ${Number(o.originalPrice ?? 200)}`,
        originalPrice: Number(o.originalPrice ?? 200),
        discountedPrice: Number(o.discountedPrice ?? 160),
        discountPercent: Number(o.discountPercent ?? 20),
        promoPrice: Math.round(Number(o.discountedPrice ?? 160) * 0.9),
        promoCode: 'TABAQ10',
        boughtCount: o.boughtCount ?? 0,
      }] as OfferTier[],
    }));
    return api;
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
    <div className="min-h-screen bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
            <p className="text-purple-100 text-base mb-6 leading-relaxed">
              {t('Curated deals from the finest dining spots across Saudi Arabia.', 'عروض مختارة من أرقى أماكن الطعام في المملكة العربية السعودية.')}
            </p>
            <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl overflow-hidden max-w-md">
              <Search className="w-4 h-4 text-muted-foreground ms-3.5 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Search deals, restaurants...', 'ابحث عن عروض، مطاعم...')}
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
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-card focus:outline-none shrink-0 cursor-pointer">
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={city} onChange={e => setCity(e.target.value)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-card focus:outline-none shrink-0 cursor-pointer">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="w-px h-5 bg-border shrink-0 mx-1" />
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
                  category === cat ? 'bg-foreground text-background shadow-sm' : 'bg-secondary/60 text-foreground hover:bg-secondary'
                }`}>
                {cat === 'All' ? t('All Deals', 'كل العروض') : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured deal */}
        {featuredOffer && !search && category === 'All' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">{t("Editor's Pick", 'اختيار المحرر')}</h2>
              <span className="text-xs text-muted-foreground">{t('Handpicked for you', 'مختار خصيصاً لك')}</span>
            </div>
            <div
              onClick={() => setSelectedOffer(featuredOffer)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-muted"
              style={{ height: 280 }}
            >
              <img src={featuredOffer.imageUrl} alt={lang === 'ar' ? featuredOffer.titleAr : featuredOffer.titleEn} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 start-0 end-0 p-6 text-white">
                <p className="text-xs font-semibold text-white/70 mb-1">{lang === 'ar' ? featuredOffer.restaurantNameAr : featuredOffer.restaurantNameEn}</p>
                <h3 className="text-xl font-bold leading-snug mb-2 line-clamp-2">{lang === 'ar' ? featuredOffer.titleAr : featuredOffer.titleEn}</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white/50 text-xs line-through">{featuredOffer.currency} {featuredOffer.originalPrice}</p>
                    <p className="text-white font-black text-xl leading-none">{featuredOffer.currency} {featuredOffer.discountedPrice}</p>
                  </div>
                  <span className="text-xs font-bold bg-[#2e7d32] text-white px-2.5 py-1 rounded-md">-{Math.round(Number(featuredOffer.discountPercent))}%</span>
                  <span className="ms-auto text-xs font-semibold bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-white/30 group-hover:bg-white/30 transition-colors">
                    {t('Get Deal', 'احصل على العرض')} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {search ? t(`Results for "${search}"`, `نتائج "${search}"`) : t('All Deals', 'كل العروض')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} {t('deals available', 'عرض متاح')}</p>
          </div>
        </div>

        {/* Grid */}
        {offersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
                <div className="bg-muted" style={{ aspectRatio: '4/3' }} />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-3" />
                  <div className="h-5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
