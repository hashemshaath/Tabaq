import React, { useState } from 'react';
import { Heart, MessageCircle, Star, Shield, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react';
import {
  useListReviewComments,
  useAddReviewComment,
  useDeleteReviewComment,
  useLikeReview,
  getListReviewCommentsQueryKey,
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

  const handleLike = () => {
    if (!user) return;
    likeReview.mutate({ reviewId: review.id });
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

      {/* Review text */}
      {reviewText && (
        <p className="text-sm text-foreground leading-relaxed">{reviewText}</p>
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
