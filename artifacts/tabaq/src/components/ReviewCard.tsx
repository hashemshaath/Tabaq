import React, { useState } from 'react';
import { Heart, MessageCircle, Star, Shield, ChevronDown, ChevronUp, Send, Trash2, Pencil, Flag, Check, X } from 'lucide-react';
import {
  useListReviewComments,
  useAddReviewComment,
  useDeleteReviewComment,
  useLikeReview,
  useUpdateReview,
  useReportReview,
  getListReviewCommentsQueryKey,
  type ReportRequestReason,
} from '@workspace/api-client-react';
import type { Review, ReviewComment } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

interface ReviewCardProps {
  review: Review & {
    restaurantNameEn?: string;
    restaurantNameAr?: string;
    dishNameEn?: string;
    dishNameAr?: string;
  };
  showTarget?: boolean;
  onDelete?: (id: number) => void;
}

function SubRatingBar({ label, value }: { label: string; value: number | undefined }) {
  if (!value || value === 0) return null;
  const pct = (Number(value) / 5) * 100;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-grow h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-foreground font-medium w-6 text-end">{Number(value).toFixed(1)}</span>
    </div>
  );
}

export function ReviewCard({ review, showTarget = false, onDelete }: ReviewCardProps) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localLiked, setLocalLiked] = useState(review.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(review.likeCount);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportRequestReason>('spam');
  const [reportDone, setReportDone] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editRating, setEditRating] = useState(Number(review.ratingOverall));
  const [editTextEn, setEditTextEn] = useState(review.textEn ?? '');
  const [editTextAr, setEditTextAr] = useState(review.textAr ?? '');

  const queryClient = useQueryClient();

  const { data: commentsData } = useListReviewComments(review.id, {
    query: {
      queryKey: getListReviewCommentsQueryKey(review.id),
      enabled: showComments,
    },
  });

  const likeReview = useLikeReview({
    mutation: {
      onMutate: () => {
        setLocalLiked(prev => !prev);
        setLocalLikeCount(prev => localLiked ? prev - 1 : prev + 1);
      },
      onSuccess: (data) => {
        setLocalLiked(data.isLiked);
        setLocalLikeCount(data.likeCount);
        queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      },
      onError: () => {
        setLocalLiked(review.isLiked);
        setLocalLikeCount(review.likeCount);
      },
    },
  });

  const addComment = useAddReviewComment({
    mutation: {
      onSuccess: () => {
        setCommentText('');
        queryClient.invalidateQueries({ queryKey: getListReviewCommentsQueryKey(review.id) });
        queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      },
    },
  });

  const deleteComment = useDeleteReviewComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReviewCommentsQueryKey(review.id) });
      },
    },
  });

  const updateReview = useUpdateReview({
    mutation: {
      onSuccess: () => {
        setEditMode(false);
        queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
        queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      },
    },
  });

  const reportReview = useReportReview({
    mutation: {
      onSuccess: () => {
        setReportDone(true);
        setTimeout(() => setShowReport(false), 2000);
      },
    },
  });

  const handleLike = () => {
    if (!user) return;
    likeReview.mutate({ reviewId: review.id });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateReview.mutate({
      reviewId: review.id,
      data: {
        ratingOverall: editRating,
        textEn: editTextEn || undefined,
        textAr: editTextAr || undefined,
      },
    });
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    reportReview.mutate({ reviewId: review.id, data: { reason: reportReason } });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    addComment.mutate({ reviewId: review.id, data: { text: commentText.trim() } });
  };

  const userName = lang === 'ar' ? (review.userNameAr || review.userNameEn) : review.userNameEn;
  const reviewText = lang === 'ar' ? (review.textAr || review.textEn) : (review.textEn || review.textAr);
  const commentCount = review.commentCount ?? 0;

  const hasSubRatings = review.ratingFood || review.ratingService || review.ratingAmbiance || review.ratingValue;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
            {review.userAvatarUrl ? (
              <img src={review.userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-sm">{(userName || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground text-sm">{userName}</p>
              {review.userIsVerified && (
                <span title={t('Verified Reviewer', 'مراجع موثوق')}>
                  <Shield className="w-3.5 h-3.5 text-primary" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{review.userLevelTitle ?? 'Food Explorer'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-amber-700">{Number(review.ratingOverall).toFixed(1)}</span>
        </div>
      </div>

      {/* Target (restaurant/dish) */}
      {showTarget && (review.restaurantNameEn || review.dishNameEn) && (
        <p className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-1.5">
          {review.restaurantId ? (
            <Link href={`/restaurants/${review.restaurantId}`} className="hover:text-primary transition-colors">
              {lang === 'ar' ? review.restaurantNameAr ?? review.restaurantNameEn : review.restaurantNameEn}
            </Link>
          ) : (
            <span>{lang === 'ar' ? review.dishNameAr ?? review.dishNameEn : review.dishNameEn}</span>
          )}
        </p>
      )}

      {/* Edit mode */}
      {editMode && (
        <form onSubmit={handleEdit} className="space-y-3 bg-muted/30 rounded-xl p-4">
          {/* Star rating picker */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setEditRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`w-5 h-5 ${star <= editRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={editTextEn}
            onChange={(e) => setEditTextEn(e.target.value)}
            placeholder={t('Update your review (English)...', 'عدّل تقييمك (إنجليزي)...')}
            rows={2}
            maxLength={2000}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={editTextAr}
            onChange={(e) => setEditTextAr(e.target.value)}
            placeholder={t('Update your review (Arabic)...', 'عدّل تقييمك (عربي)...')}
            rows={2}
            maxLength={2000}
            dir="rtl"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateReview.isPending}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {t('Save', 'حفظ')}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t('Cancel', 'إلغاء')}
            </button>
          </div>
        </form>
      )}

      {/* Review text */}
      {!editMode && reviewText && (
        <p className="text-sm text-foreground leading-relaxed">{reviewText}</p>
      )}

      {/* Report panel */}
      {showReport && (
        <form onSubmit={handleReport} className="space-y-2 bg-red-50 border border-red-200 rounded-xl p-3">
          {reportDone ? (
            <p className="text-sm text-green-700 text-center font-medium">
              <Check className="w-4 h-4 inline me-1" />
              {t('Report submitted. Thank you.', 'تم إرسال البلاغ. شكراً.')}
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold text-red-800">{t('Report this review', 'الإبلاغ عن هذا التقييم')}</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportRequestReason)}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="spam">{t('Spam', 'بريد مزعج')}</option>
                <option value="inappropriate">{t('Inappropriate', 'محتوى غير لائق')}</option>
                <option value="offensive">{t('Offensive', 'مسيء')}</option>
                <option value="fake">{t('Fake review', 'تقييم مزيف')}</option>
                <option value="other">{t('Other', 'أخرى')}</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reportReview.isPending}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {t('Submit report', 'إرسال البلاغ')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="bg-muted text-muted-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-muted/70 transition-colors"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Photos */}
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {review.photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-24 h-24 object-cover rounded-xl shrink-0 border border-border/40"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
        </div>
      )}

      {/* Sub-ratings */}
      {hasSubRatings && (
        <div className="space-y-2 bg-muted/30 rounded-xl p-3">
          <SubRatingBar label={t('Food', 'الطعام')} value={Number(review.ratingFood)} />
          <SubRatingBar label={t('Service', 'الخدمة')} value={Number(review.ratingService)} />
          <SubRatingBar label={t('Ambiance', 'الأجواء')} value={Number(review.ratingAmbiance)} />
          <SubRatingBar label={t('Value', 'القيمة')} value={Number(review.ratingValue)} />
        </div>
      )}

      {/* Footer: date + actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!user || likeReview.isPending}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              localLiked
                ? 'text-rose-500'
                : 'text-muted-foreground hover:text-rose-400'
            } ${!user ? 'cursor-default' : ''}`}
            title={!user ? t('Sign in to like', 'سجّل للإعجاب') : ''}
          >
            <Heart className={`w-4 h-4 ${localLiked ? 'fill-rose-500' : ''}`} />
            <span>{localLikeCount}</span>
          </button>

          {/* Comment toggle */}
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Visit date */}
          {review.visitDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(review.visitDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit if owner */}
          {user?.id === review.userId && (
            <button
              onClick={() => setEditMode(v => !v)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={t('Edit review', 'تعديل التقييم')}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {/* Delete if owner */}
          {user?.id === review.userId && onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title={t('Delete review', 'حذف التقييم')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* Report if not owner */}
          {user && user.id !== review.userId && (
            <button
              onClick={() => { setShowReport(v => !v); setReportDone(false); }}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={t('Report review', 'الإبلاغ عن التقييم')}
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border/40 pt-4 space-y-3">
          {commentsData?.comments?.map((comment: ReviewComment) => (
            <div key={comment.id} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {comment.userAvatarUrl ? (
                  <img src={comment.userAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {(comment.userNameEn || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-grow bg-muted/40 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {lang === 'ar' ? comment.userNameAr || comment.userNameEn : comment.userNameEn}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {user?.id === comment.userId && (
                      <button
                        onClick={() => deleteComment.mutate({ reviewId: review.id, commentId: comment.id })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{comment.text}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          {user && (
            <form onSubmit={handleComment} className="flex gap-2 mt-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('Add a comment...', 'أضف تعليقاً...')}
                maxLength={500}
                className="flex-grow bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="bg-primary text-primary-foreground rounded-xl px-3 py-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              {t('Sign in to comment', 'سجّل دخولك للتعليق')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
