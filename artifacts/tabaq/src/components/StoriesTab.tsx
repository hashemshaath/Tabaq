import React, { useState } from 'react';
import { Camera, Plus, CheckCircle2, Clock, Image, Video, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/lib/api';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

type Story = {
  id: number;
  restaurantId: number;
  userId: number;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  captionAr?: string;
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
};

function StoryCard({ story, lang }: { story: Story; lang: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const caption = lang === 'ar' ? story.captionAr : story.caption;
  const formattedDate = new Date(story.createdAt).toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : 'en-SA',
    { month: 'short', day: 'numeric' }
  );

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-muted aspect-[3/4] cursor-pointer">
      {story.mediaType === 'video' ? (
        <video
          src={story.mediaUrl}
          className="w-full h-full object-cover"
          autoPlay={isPlaying}
          loop
          muted
          playsInline
          onClick={() => setIsPlaying(!isPlaying)}
        />
      ) : (
        <img
          src={story.mediaUrl}
          alt={caption || ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {story.mediaType === 'video' && (
        <div className="absolute top-3 end-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Video className="w-3 h-3" />
          Video
        </div>
      )}

      <div className="absolute bottom-0 w-full p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        {caption && (
          <p className="text-white text-xs font-medium line-clamp-2 mb-1.5">{caption}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {story.userAvatar ? (
              <img src={story.userAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">{(story.userName || 'U')[0]}</span>
              </div>
            )}
            <span className="text-white/80 text-[10px]">{story.userName || 'Guest'}</span>
          </div>
          <span className="text-white/60 text-[10px]">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

function SubmitStoryForm({ restaurantId, onSuccess, onCancel }: {
  restaurantId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const submitStory = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/stories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          caption: lang === 'en' ? caption : undefined,
          captionAr: lang === 'ar' ? caption : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => { onSuccess(); },
    onError: () => setError(t('Failed to submit. Please try again.', 'فشل الإرسال. حاول مرة أخرى.')),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground">{t('Share Your Story', 'شارك قصتك')}</h4>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        {(['photo', 'video'] as const).map(type => (
          <button
            key={type}
            onClick={() => setMediaType(type)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              mediaType === type ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {type === 'photo' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            {type === 'photo' ? t('Photo', 'صورة') : t('Video', 'فيديو')}
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {t('Media URL', 'رابط الوسائط')} <span className="text-destructive">*</span>
        </label>
        <input
          type="url"
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          placeholder="https://..."
          className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {t('Caption (Optional)', 'وصف (اختياري)')}
        </label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder={t('Describe your experience...', 'صف تجربتك...')}
          className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-end">{caption.length}/200</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        {t(
          'Your story will be reviewed by our team before appearing publicly. This usually takes up to 24 hours.',
          'ستتم مراجعة قصتك من قِبل فريقنا قبل ظهورها للعموم. يستغرق هذا عادةً 24 ساعة.'
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full gap-2"
        onClick={() => submitStory.mutate()}
        disabled={!mediaUrl.trim() || submitStory.isPending}
      >
        <Upload className="w-4 h-4" />
        {submitStory.isPending ? t('Submitting...', 'جاري الإرسال...') : t('Submit Story', 'إرسال القصة')}
      </Button>
    </div>
  );
}

export function StoriesTab({ restaurantId }: { restaurantId: number }) {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['restaurant-stories', restaurantId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/stories`, {
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.stories ?? []);
    },
  });

  const approvedStories = stories.filter(s => s.status === 'approved');

  const handleSuccess = () => {
    setShowForm(false);
    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ['restaurant-stories', restaurantId] });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">{t('Stories', 'القصص')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {approvedStories.length > 0
              ? `${approvedStories.length} ${t('community photos & videos', 'صورة وفيديو من المجتمع')}`
              : t('Be the first to share a story!', 'كن أول من يشارك قصة!')
            }
          </p>
        </div>
        {user && !showForm && !submitted && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            {t('Add Story', 'أضف قصة')}
          </Button>
        )}
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-green-800 text-sm">{t('Story submitted!', 'تم إرسال القصة!')}</p>
            <p className="text-xs text-green-700">{t('Your story is under review and will appear within 24 hours.', 'قصتك قيد المراجعة وستظهر خلال 24 ساعة.')}</p>
          </div>
        </div>
      )}

      {showForm && (
        <SubmitStoryForm
          restaurantId={restaurantId}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!user && (
        <div className="bg-secondary/30 border border-border/60 rounded-2xl p-5 text-center">
          <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1 text-sm">{t('Share your experience', 'شارك تجربتك')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('Sign in to upload photos & videos', 'سجّل دخولك لرفع الصور والفيديوهات')}</p>
          <Link href="/signin">
            <Button size="sm">{t('Sign In', 'تسجيل الدخول')}</Button>
          </Link>
        </div>
      )}

      {approvedStories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {approvedStories.map(story => (
            <StoryCard key={story.id} story={story} lang={lang} />
          ))}
        </div>
      ) : (
        !submitted && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="font-semibold text-foreground mb-1">{t('No stories yet', 'لا توجد قصص بعد')}</p>
            <p className="text-sm text-muted-foreground">
              {user
                ? t('Be the first to share a photo or video from this restaurant.', 'كن أول من يشارك صورة أو فيديو من هذا المطعم.')
                : t('Sign in to be the first to share a story!', 'سجّل دخولك لتكون أول من يشارك قصة!')
              }
            </p>
            {user && (
              <Button
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4" />
                {t('Share a Story', 'شارك قصة')}
              </Button>
            )}
          </div>
        )
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
        <Clock className="w-3.5 h-3.5" />
        {t('Stories are reviewed by Tabaq team before publishing.', 'تتم مراجعة القصص من قِبل فريق طبق قبل النشر.')}
      </div>
    </div>
  );
}
