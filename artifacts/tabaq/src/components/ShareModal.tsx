import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageCircle, Link2, Share2, QrCode } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { StarRating } from '@/components/StarRating';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    nameEn: string;
    nameAr: string;
    coverImageUrl?: string;
    avgRating?: number | string | null;
    cuisineEn?: string;
    cuisineAr?: string;
    cityEn?: string;
    cityAr?: string;
  };
  url?: string;
}

export function ShareModal({ isOpen, onClose, restaurant, url }: ShareModalProps) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [nativeShared, setNativeShared] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const name = lang === 'ar' ? restaurant.nameAr : restaurant.nameEn;
  const cuisine = lang === 'ar' ? (restaurant.cuisineAr || restaurant.cuisineEn) : (restaurant.cuisineEn || restaurant.cuisineAr);
  const city = lang === 'ar' ? (restaurant.cityAr || restaurant.cityEn) : (restaurant.cityEn || restaurant.cityAr);
  const rating = typeof restaurant.avgRating === 'string' ? parseFloat(restaurant.avgRating) : (restaurant.avgRating ?? 0);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const msg = lang === 'ar'
      ? `جرّب ${restaurant.nameAr} على طبق! ${shareUrl}`
      : `Check out ${restaurant.nameEn} on Tabaq! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url: shareUrl });
        setNativeShared(true);
        setTimeout(() => setNativeShared(false), 2000);
      } catch {}
    }
  };

  const fallbackImg = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Share2 className="w-4.5 h-4.5 text-primary" />
            <h2 className="font-bold text-foreground">{t('Share', 'مشاركة')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Restaurant Card Preview */}
        <div className="mx-5 mt-5 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
          <div className="relative h-36">
            <img
              src={restaurant.coverImageUrl || fallbackImg}
              alt={name}
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 start-0 end-0 p-3">
              <p className="text-white font-bold text-base leading-tight truncate">{name}</p>
              {(cuisine || city) && (
                <p className="text-white/80 text-xs mt-0.5">
                  {[cuisine, city].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {/* Tabaq badge */}
            <div className="absolute top-3 end-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
              <span className="text-primary font-black text-xs tracking-tight">طبق</span>
              <span className="text-muted-foreground/60 text-[10px]">·</span>
              <span className="text-primary font-black text-xs tracking-tight">Tabaq</span>
            </div>
          </div>
          <div className="bg-muted/30 px-3 py-2.5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">{shareUrl.replace(/^https?:\/\//, '')}</p>
            {rating > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 ms-2">
                <StarRating rating={rating} size="xs" />
                <span className="text-xs font-bold text-foreground">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Share Actions */}
        <div className="p-5 space-y-3">
          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-border hover:border-primary/40 hover:bg-primary/5 text-foreground'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${copied ? 'bg-green-100' : 'bg-muted'}`}>
              {copied ? <Check className="w-4.5 h-4.5 text-green-600" /> : <Copy className="w-4.5 h-4.5 text-muted-foreground" />}
            </div>
            <div className="text-start">
              <p className="text-sm font-semibold">{copied ? t('Link copied!', 'تم نسخ الرابط!') : t('Copy link', 'نسخ الرابط')}</p>
              <p className="text-xs text-muted-foreground">{copied ? t('Paste it anywhere', 'الصقه في أي مكان') : t('Copy restaurant link to clipboard', 'نسخ رابط المطعم')}</p>
            </div>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border hover:border-green-500/40 hover:bg-green-50 text-foreground transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-green-100">
              <MessageCircle className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div className="text-start">
              <p className="text-sm font-semibold">{t('Share on WhatsApp', 'مشاركة عبر واتساب')}</p>
              <p className="text-xs text-muted-foreground">{t('Send to a friend or group', 'أرسل لصديق أو مجموعة')}</p>
            </div>
          </button>

          {/* Native Share (shown if available) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                <Link2 className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div className="text-start">
                <p className="text-sm font-semibold">
                  {nativeShared ? t('Shared!', 'تمت المشاركة!') : t('More options', 'خيارات أكثر')}
                </p>
                <p className="text-xs text-muted-foreground">{t('Open system share sheet', 'فتح قائمة المشاركة')}</p>
              </div>
            </button>
          )}
        </div>

        {/* Bottom safe area padding for mobile */}
        <div className="h-safe-area-bottom sm:hidden" />
      </div>
    </div>
  );
}
