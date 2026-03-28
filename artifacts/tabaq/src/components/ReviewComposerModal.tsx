import React, { useState } from 'react';
import { X, Star, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateReview } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';

interface ReviewComposerModalProps {
  restaurantId?: number;
  restaurantNameEn?: string;
  restaurantNameAr?: string;
  dishId?: number;
  dishNameEn?: string;
  dishNameAr?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function StarRating({
  value,
  onChange,
  label,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  const [hovered, setHovered] = useState(0);
  const starClass = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`${starClass} transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-xs font-medium text-amber-600 ms-1">{value}.0</span>
      )}
    </div>
  );
}

export function ReviewComposerModal({
  restaurantId,
  restaurantNameEn,
  restaurantNameAr,
  dishId,
  dishNameEn,
  dishNameAr,
  onClose,
  onSuccess,
}: ReviewComposerModalProps) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();

  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingFood, setRatingFood] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [ratingAmbiance, setRatingAmbiance] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [textEn, setTextEn] = useState('');
  const [textAr, setTextAr] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
        if (restaurantId) {
          queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
        }
        onSuccess?.();
        onClose();
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message;
        if (msg?.includes('already reviewed')) {
          setError(t('You have already reviewed this.', 'لقد قيّمت هذا مسبقاً.'));
        } else {
          setError(t('Failed to submit review. Please try again.', 'فشل إرسال التقييم. حاول مرة أخرى.'));
        }
      },
    },
  });

  const targetName = restaurantId
    ? (lang === 'ar' ? restaurantNameAr : restaurantNameEn) ?? ''
    : (lang === 'ar' ? dishNameAr : dishNameEn) ?? '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (ratingOverall === 0) {
      setError(t('Please select an overall star rating.', 'الرجاء اختيار تقييم نجوم إجمالي.'));
      return;
    }

    const validPhotos = photoUrls.filter(u => u.trim() !== '');

    createReview.mutate({
      data: {
        restaurantId: restaurantId ?? undefined,
        dishId: dishId ?? undefined,
        ratingOverall,
        ratingFood: ratingFood || undefined,
        ratingService: ratingService || undefined,
        ratingAmbiance: ratingAmbiance || undefined,
        ratingValue: ratingValue || undefined,
        textEn: textEn.trim() || undefined,
        textAr: textAr.trim() || undefined,
        visitDate: visitDate || undefined,
        photoUrls: validPhotos,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/60 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="font-bold text-foreground text-lg">{t('Write a Review', 'اكتب تقييماً')}</h2>
            {targetName && (
              <p className="text-sm text-muted-foreground">{targetName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating — required */}
          <div>
            <p className="font-semibold text-foreground mb-3">
              {t('Overall Rating', 'التقييم الإجمالي')}
              <span className="text-destructive ms-1">*</span>
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingOverall(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      star <= ratingOverall
                        ? 'fill-amber-400 text-amber-400 scale-110'
                        : 'text-muted-foreground/30 hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
              {ratingOverall > 0 && (
                <span className="self-center ms-2 text-2xl font-bold text-amber-500">
                  {ratingOverall}.0
                </span>
              )}
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-3">
            <label className="font-semibold text-foreground text-sm">
              {t('Your Review', 'تقييمك')}
            </label>
            <textarea
              value={lang === 'ar' ? textAr : textEn}
              onChange={(e) => lang === 'ar' ? setTextAr(e.target.value) : setTextEn(e.target.value)}
              placeholder={t('Share your dining experience...', 'شارك تجربتك في هذا المكان...')}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={4}
              maxLength={1000}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground text-end">
              {(lang === 'ar' ? textAr : textEn).length}/1000
            </p>
          </div>

          {/* Sub-ratings + photos — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {t('Add detailed ratings & photos', 'أضف تقييمات تفصيلية وصور')}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                {/* Detailed ratings */}
                <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">{t('Detailed Ratings', 'التقييمات التفصيلية')}</p>
                  {restaurantId && (
                    <>
                      <StarRating value={ratingFood} onChange={setRatingFood} label={t('Food', 'الطعام')} size="sm" />
                      <StarRating value={ratingService} onChange={setRatingService} label={t('Service', 'الخدمة')} size="sm" />
                      <StarRating value={ratingAmbiance} onChange={setRatingAmbiance} label={t('Ambiance', 'الأجواء')} size="sm" />
                    </>
                  )}
                  <StarRating value={ratingValue} onChange={setRatingValue} label={t('Value', 'القيمة')} size="sm" />
                </div>

                {/* Visit date */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    {t('Visit Date', 'تاريخ الزيارة')}
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-auto"
                  />
                </div>

                {/* Photo URLs */}
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                    <Camera className="w-4 h-4" />
                    {t('Photo URLs', 'روابط الصور')}
                  </label>
                  <div className="space-y-2">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const updated = [...photoUrls];
                            updated[i] = e.target.value;
                            setPhotoUrls(updated);
                          }}
                          placeholder="https://..."
                          className="flex-grow bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {photoUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive p-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {photoUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrls([...photoUrls, ''])}
                        className="text-sm text-primary hover:underline"
                      >
                        + {t('Add another photo', 'أضف صورة أخرى')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createReview.isPending || ratingOverall === 0}
            >
              {createReview.isPending ? t('Submitting...', 'جاري الإرسال...') : t('Submit Review', 'إرسال التقييم')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
