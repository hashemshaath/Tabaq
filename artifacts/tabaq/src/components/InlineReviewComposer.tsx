import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Camera, Send, X, Award, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface InlineReviewComposerProps {
  restaurantId?: number;
  restaurantNameEn?: string;
  restaurantNameAr?: string;
  dishId?: number;
  dishNameEn?: string;
  dishNameAr?: string;
  onSuccess?: () => void;
  invalidateKey?: unknown[];
}

function StarPicker({ value, onChange, size = 'lg' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'lg' }) {
  const [hovered, setHovered] = useState(0);
  const cls = size === 'lg' ? 'w-9 h-9' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star className={`${cls} transition-all ${star <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  );
}

type Mode = 'regular' | 'expert';

export function InlineReviewComposer({
  restaurantId, restaurantNameEn, restaurantNameAr,
  dishId, dishNameEn, dishNameAr,
  onSuccess, invalidateKey,
}: InlineReviewComposerProps) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('regular');
  const [overall, setOverall] = useState(0);
  const [food, setFood] = useState(0);
  const [service, setService] = useState(0);
  const [ambiance, setAmbiance] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [text, setText] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [ratingPresentation, setRatingPresentation] = useState(0);
  const [ratingIngredients, setRatingIngredients] = useState(0);
  const [ratingTechnique, setRatingTechnique] = useState(0);
  const [ratingCreativity, setRatingCreativity] = useState(0);
  const [ratingPortionSize, setRatingPortionSize] = useState(0);

  const queryClient = useQueryClient();

  if (!user) {
    return (
      <div className="bg-secondary/30 border border-border/60 rounded-2xl p-6 text-center">
        <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-foreground mb-1">{t('Share your experience', 'شارك تجربتك')}</p>
        <p className="text-sm text-muted-foreground mb-4">{t('Sign in to write a review', 'سجّل دخولك لكتابة تقييم')}</p>
        <Link href="/signin">
          <Button size="sm">{t('Sign In', 'تسجيل الدخول')}</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-7 h-7 fill-green-500 text-green-500" />
        </div>
        <p className="font-bold text-green-800 mb-1">{t('Review submitted!', 'تم إرسال التقييم!')}</p>
        <p className="text-sm text-green-700">{t('Thank you for sharing your experience.', 'شكراً لمشاركة تجربتك.')}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || overall === 0) {
      setError(t('Please select a star rating.', 'الرجاء اختيار تقييم بالنجوم.'));
      return;
    }
    setError('');
    setIsPending(true);

    const validPhotos = photoUrls.filter(u => u.trim() !== '');
    const body: Record<string, unknown> = {
      restaurantId,
      dishId,
      ratingOverall: overall,
      ratingFood: food || undefined,
      ratingService: service || undefined,
      ratingAmbiance: ambiance || undefined,
      ratingValue: valueRating || undefined,
      textEn: lang === 'en' ? text.trim() || undefined : undefined,
      textAr: lang === 'ar' ? text.trim() || undefined : undefined,
      visitDate: visitDate || undefined,
      photoUrls: validPhotos,
    };

    if (mode === 'expert') {
      body.isExpertReview = true;
      if (ratingPresentation) body.ratingPresentation = ratingPresentation;
      if (ratingIngredients) body.ratingIngredients = ratingIngredients;
      if (ratingTechnique) body.ratingTechnique = ratingTechnique;
      if (ratingCreativity) body.ratingCreativity = ratingCreativity;
      if (ratingPortionSize) body.ratingPortionSize = ratingPortionSize;
    }

    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message?.includes('already reviewed')) {
          throw new Error('already reviewed');
        }
        throw new Error('failed');
      }
      if (invalidateKey) queryClient.invalidateQueries({ queryKey: invalidateKey });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg?.includes('already reviewed')) {
        setError(t('You have already reviewed this.', 'لقد قيّمت هذا مسبقاً.'));
      } else {
        setError(t('Failed to submit. Please try again.', 'فشل الإرسال. حاول مرة أخرى.'));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-primary font-bold text-sm">{(user.nameEn || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{lang === 'ar' ? (user.nameAr || user.nameEn) : (user.nameEn || user.nameAr)}</p>
            <p className="text-xs text-muted-foreground">{t('Write a public review', 'اكتب تقييماً عاماً')}</p>
          </div>
        </div>

        <div className="flex items-center bg-secondary/60 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('regular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'regular'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            {t('Regular', 'عادي')}
          </button>
          <button
            type="button"
            onClick={() => setMode('expert')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'expert'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {t('Critic', 'ناقد')}
          </button>
        </div>
      </div>

      {mode === 'expert' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-2">
          <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{t('Critic Mode', 'وضع الناقد')}</p>
            <p className="text-[11px] text-amber-700">
              {t(
                'Rate with professional criteria. Your expert review will be highlighted on the restaurant page.',
                'قيّم بمعايير احترافية. تقييمك كناقد سيُبرز على صفحة المطعم.'
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">
            {t('Overall Rating', 'التقييم الإجمالي')} <span className="text-destructive">*</span>
          </p>
          <div className="flex items-center gap-3">
            <StarPicker value={overall} onChange={setOverall} size="lg" />
            {overall > 0 && (
              <span className="text-xl font-bold text-amber-500">{overall}.0</span>
            )}
          </div>
        </div>

        {mode === 'expert' && (
          <div className="bg-secondary/20 rounded-2xl p-4 space-y-4 border border-border/50">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {t('Professional Criteria', 'المعايير الاحترافية')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: t('Presentation', 'التقديم'), val: ratingPresentation, set: setRatingPresentation },
                { label: t('Ingredients', 'المكونات'), val: ratingIngredients, set: setRatingIngredients },
                { label: t('Technique', 'التقنية'), val: ratingTechnique, set: setRatingTechnique },
                { label: t('Creativity', 'الإبداع'), val: ratingCreativity, set: setRatingCreativity },
                { label: t('Portion Size', 'حجم الوجبة'), val: ratingPortionSize, set: setRatingPortionSize },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between gap-2 bg-background rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-foreground w-24 shrink-0">{label}</span>
                  <StarPicker value={val} onChange={set} size="sm" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Info className="w-3 h-3 shrink-0" />
              {t('Professional criteria are optional but strengthen your review.', 'المعايير الاحترافية اختيارية لكنها تعزز تقييمك.')}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">{t('Your Review', 'تقييمك')}</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              mode === 'expert'
                ? t('As a food critic, describe the experience in detail...', 'بوصفك ناقداً غذائياً، صف التجربة بالتفصيل...')
                : t('Share your dining experience...', 'شارك تجربتك في هذا المكان...')
            }
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows={mode === 'expert' ? 5 : 4}
            maxLength={mode === 'expert' ? 2000 : 1000}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
          <p className="text-xs text-muted-foreground text-end mt-1">
            {text.length}/{mode === 'expert' ? 2000 : 1000}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t('Add detailed ratings & visit info', 'أضف تقييمات تفصيلية ومعلومات الزيارة')}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4 bg-secondary/20 rounded-2xl p-4">
              {restaurantId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: t('Food', 'الطعام'), val: food, set: setFood },
                    { label: t('Service', 'الخدمة'), val: service, set: setService },
                    { label: t('Ambiance', 'الأجواء'), val: ambiance, set: setAmbiance },
                    { label: t('Value', 'القيمة'), val: valueRating, set: setValueRating },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{label}</span>
                      <StarPicker value={val} onChange={set} size="sm" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">{t('Visit Date', 'تاريخ الزيارة')}</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
                  <Camera className="w-3.5 h-3.5" />
                  {t('Photo URLs (optional)', 'روابط الصور (اختياري)')}
                </label>
                <div className="space-y-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={e => { const u = [...photoUrls]; u[i] = e.target.value; setPhotoUrls(u); }}
                        placeholder="https://..."
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {photoUrls.length > 1 && (
                        <button type="button" onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {photoUrls.length < 5 && (
                    <button type="button" onClick={() => setPhotoUrls([...photoUrls, ''])} className="text-sm text-primary hover:underline">
                      + {t('Add photo', 'أضف صورة')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <Button
          type="submit"
          className={`w-full gap-2 ${mode === 'expert' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          disabled={isPending || overall === 0}
        >
          {isPending ? (
            <span>{t('Submitting...', 'جاري الإرسال...')}</span>
          ) : (
            <>
              {mode === 'expert' ? <Award className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {mode === 'expert'
                ? t('Submit Critic Review', 'إرسال تقييم الناقد')
                : t('Submit Review', 'إرسال التقييم')
              }
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
