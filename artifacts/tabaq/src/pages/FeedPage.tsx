import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Rss, TrendingUp, Users, Search, Heart, MessageSquare, Share2,
  Star, Award, ChevronRight, Utensils, Camera, Flame, Bookmark,
  Plus, ArrowUp, MapPin, Clock, CheckCircle2, UserPlus, X,
  ChevronLeft, Send, Sparkles, Tag, Eye, Play
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGetFeed, useListReviews } from '@workspace/api-client-react';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, API_BASE } from '@/lib/api';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

type FeedTab = 'following' | 'community';

// ── Story Types ────────────────────────────────────────────────────────────────

type StoryType = 'checkin' | 'dish_spotlight' | 'offer' | 'event' | 'new_menu' | 'recommendation';

interface Story {
  id: number;
  image: string;
  type: StoryType;
  typeEn: string;
  typeAr: string;
  captionEn: string;
  captionAr: string;
  locationEn?: string;
  locationAr?: string;
  tagEn?: string;
  tagAr?: string;
  restaurantId?: number;
  restaurantEn?: string;
  restaurantAr?: string;
  accentColor?: string;
}

interface StoryGroup {
  id: number;
  kind: 'user' | 'restaurant';
  nameEn: string;
  nameAr: string;
  avatar: string;
  handle?: string;
  badge?: string;
  seen: boolean;
  isMe?: boolean;
  stories: Story[];
}

const STORY_COLORS: Record<StoryType, string> = {
  checkin: 'from-rose-500 to-orange-400',
  dish_spotlight: 'from-amber-500 to-yellow-400',
  offer: 'from-green-500 to-emerald-400',
  event: 'from-violet-500 to-purple-400',
  new_menu: 'from-blue-500 to-cyan-400',
  recommendation: 'from-pink-500 to-fuchsia-400',
};

const STORY_DURATION_MS = 6000;

// ── Story Viewer ───────────────────────────────────────────────────────────────

function StoryViewer({
  groups,
  startGroupIndex,
  onClose,
  lang,
  t,
}: {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
  lang: string;
  t: (en: string, ar: string) => string;
}) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const storyKey = `${groupIdx}-${storyIdx}`;

  const goNextStory = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, group, groups, onClose]);

  const goPrevStory = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      const prevGroup = groups[groupIdx - 1];
      setStoryIdx(prevGroup.stories.length - 1);
    }
  }, [storyIdx, groupIdx, groups]);

  useEffect(() => {
    if (paused) return;
    elapsedRef.current = 0;
    startRef.current = Date.now();
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current + elapsedRef.current;
      const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        goNextStory();
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [storyKey, paused, goNextStory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNextStory();
      if (e.key === 'ArrowLeft') goPrevStory();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNextStory, goPrevStory]);

  if (!group || group.stories.length === 0) return null;

  const accentHex = story?.accentColor ?? '#e23744';
  const typeGradient = story ? STORY_COLORS[story.type] : 'from-primary to-primary/60';

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showReply) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) goPrevStory();
    else goNextStory();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Story container */}
      <div
        className="relative w-full max-w-sm h-full max-h-[100dvh] overflow-hidden select-none"
        onMouseDown={() => { setPaused(true); elapsedRef.current += Date.now() - startRef.current; if (timerRef.current) clearInterval(timerRef.current); }}
        onMouseUp={() => { setPaused(false); startRef.current = Date.now(); }}
        onClick={handleTap}
      >
        {/* Background image */}
        <img
          key={story?.id}
          src={story?.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top bar */}
        <div className="absolute top-6 inset-x-3 flex items-center gap-3 z-10 pointer-events-none">
          <div className="relative shrink-0">
            <img src={group.avatar} alt={group.nameEn} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/80" />
            {group.kind === 'restaurant' && (
              <span className="absolute -bottom-1 -end-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center text-[8px] text-white font-black">R</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-sm leading-none">
                {lang === 'ar' ? group.nameAr : group.nameEn}
              </p>
              {group.badge && <span className="text-base leading-none">{group.badge}</span>}
            </div>
            {group.handle && <p className="text-white/60 text-xs mt-0.5">{group.handle}</p>}
          </div>
          <button
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type badge */}
        {story && (
          <div className="absolute top-20 start-4 z-10 pointer-events-none">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${typeGradient} shadow-lg`}>
              {story.type === 'checkin' && <MapPin className="w-3 h-3" />}
              {story.type === 'dish_spotlight' && <Utensils className="w-3 h-3" />}
              {story.type === 'offer' && <Tag className="w-3 h-3" />}
              {story.type === 'event' && <Sparkles className="w-3 h-3" />}
              {story.type === 'new_menu' && <Eye className="w-3 h-3" />}
              {story.type === 'recommendation' && <Star className="w-3 h-3 fill-current" />}
              {lang === 'ar' ? story.typeAr : story.typeEn}
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-6 space-y-3">
          {/* Caption */}
          {story && (
            <p className="text-white text-sm font-medium leading-relaxed line-clamp-4 pointer-events-none">
              {lang === 'ar' ? story.captionAr : story.captionEn}
            </p>
          )}

          {/* Location / Tag pills */}
          <div className="flex flex-wrap gap-2 pointer-events-none">
            {story?.locationEn && (
              <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                <MapPin className="w-3 h-3 text-primary" />
                {lang === 'ar' ? story.locationAr : story.locationEn}
              </span>
            )}
            {story?.tagEn && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/30">
                <Utensils className="w-3 h-3" />
                {lang === 'ar' ? story.tagAr : story.tagEn}
              </span>
            )}
          </div>

          {/* Restaurant CTA */}
          {story?.restaurantId && (
            <Link href={`/restaurants/${story.restaurantId}`}>
              <button
                className="w-full py-3 rounded-2xl font-bold text-sm text-white border border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 transition-colors pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
              >
                {lang === 'ar'
                  ? `عرض ${story.restaurantAr ?? story.restaurantEn}`
                  : `View ${story.restaurantEn}`}
              </button>
            </Link>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-3">
            {showReply ? (
              <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur rounded-2xl px-4 py-2.5 border border-white/20" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={t('Send a reply...', 'أرسل ردّاً...')}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none"
                />
                <button className="text-white/80 hover:text-white transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                className="flex-1 text-start text-white/60 text-sm px-4 py-2.5 bg-white/10 backdrop-blur rounded-2xl border border-white/20"
                onClick={(e) => { e.stopPropagation(); setShowReply(true); setPaused(true); }}
              >
                {t('Reply...', 'ردّ...')}
              </button>
            )}
            <button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); setLiked(prev => ({ ...prev, [storyKey]: !prev[storyKey] })); }}
            >
              <Heart className={`w-5 h-5 transition-colors ${liked[storyKey] ? 'fill-red-400 text-red-400' : 'text-white'}`} />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white"
              onClick={e => e.stopPropagation()}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Left / Right tap zones (invisible, for visual hint only) */}
        <div className="absolute inset-y-0 start-0 w-1/3 cursor-pointer pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-1/3 cursor-pointer pointer-events-none" />
      </div>

      {/* Side nav (desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrevStory(); }}
        className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors hidden sm:flex"
      >
        <ChevronLeft className="w-5 h-5" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : undefined }} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNextStory(); }}
        className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors hidden sm:flex"
      >
        <ChevronRight className="w-5 h-5" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : undefined }} />
      </button>
    </div>
  );
}

// ── Stories Strip ─────────────────────────────────────────────────────────────

function StoriesStrip({
  groups,
  onOpen,
  t,
  lang,
}: {
  groups: StoryGroup[];
  onOpen: (index: number) => void;
  t: (en: string, ar: string) => string;
  lang: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4 overflow-hidden">
      <div
        className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {groups.map((group, idx) => {
          const isMe = group.isMe;
          const hasStories = group.stories.length > 0;
          const ringClass = group.seen
            ? 'ring-2 ring-border'
            : 'ring-2 ring-transparent';

          return (
            <button
              key={group.id}
              onClick={() => {
                if (isMe) return;
                if (hasStories) onOpen(idx);
              }}
              className="flex flex-col items-center gap-2 shrink-0 snap-start group"
            >
              <div className="relative">
                {/* Gradient ring for unseen */}
                {!group.seen && !isMe && (
                  <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-primary via-orange-400 to-yellow-400 z-0" />
                )}
                {/* Restaurant indicator */}
                {group.seen && !isMe && (
                  <div className="absolute -inset-[3px] rounded-full bg-border/60 z-0" />
                )}
                <div
                  className={`relative z-10 w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-background ${isMe ? 'ring-2 ring-border' : ''}`}
                >
                  <img
                    src={group.avatar}
                    alt={group.nameEn}
                    className="w-full h-full object-cover"
                  />
                  {isMe && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                {/* Restaurant badge */}
                {group.kind === 'restaurant' && (
                  <span className="absolute -bottom-0.5 -end-0.5 z-20 bg-blue-500 text-white text-[9px] font-black rounded-full w-4.5 h-4.5 w-[18px] h-[18px] flex items-center justify-center border border-background">
                    R
                  </span>
                )}
                {/* Badge */}
                {group.badge && (
                  <span className="absolute -bottom-0.5 -end-0.5 z-20 text-xs leading-none bg-background border border-border/60 rounded-full px-0.5">
                    {group.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-foreground w-[68px] text-center leading-tight truncate">
                {lang === 'ar' ? group.nameAr : group.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Feed components ────────────────────────────────────────────────────────────



function PeopleYouMayKnowCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});

  const { data: suggested, isLoading } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/users/suggested?limit=5`, { headers: getAuthHeaders() });
      if (!res.ok) return [] as any[];
      return res.json() as Promise<any[]>;
    },
    staleTime: 60_000,
  });

  const handleFollow = async (userId: number, currentlyFollowing: boolean) => {
    if (!user) return;
    setLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await fetch(`${API_BASE}/api/users/${userId}/follow`, {
        method: currentlyFollowing ? 'DELETE' : 'POST',
        headers: getAuthHeaders(),
      });
      setFollowing(prev => ({ ...prev, [userId]: !currentlyFollowing }));
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const people = (suggested ?? []).filter((p: any) => !dismissed[p.id]);

  if (isLoading) return null;
  if (people.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">{t('People You May Know', 'أشخاص قد تعرفهم')}</h3>
        </div>
        <Link href="/leaderboard" className="text-xs text-primary font-medium hover:underline">{t('See all', 'عرض الكل')}</Link>
      </div>
      <div className="divide-y divide-border/40">
        {people.map((person: any) => (
          <div key={person.id} className="flex items-center gap-3 px-4 py-3">
            <img
              src={person.avatarUrl ?? `https://i.pravatar.cc/60?u=${person.id}`}
              alt={person.nameEn}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {lang === 'ar' ? (person.nameAr || person.nameEn) : person.nameEn}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {person.levelTitle ?? t('Food Enthusiast', 'عاشق الطعام')}
                {person.reviewCount > 0 && <span className="ms-1 opacity-70">· {person.reviewCount} {t('reviews', 'تقييم')}</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleFollow(person.id, !!following[person.id])}
                disabled={loading[person.id]}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  following[person.id]
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } disabled:opacity-60`}
              >
                {following[person.id] ? t('Following', 'متابَع') : t('Follow', 'متابعة')}
              </button>
              <button
                onClick={() => setDismissed(prev => ({ ...prev, [person.id]: true }))}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CRITIC_BADGES = ['👑', '🥈', '🥉', '⭐', '🍽️'];

function TrendingCriticsCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['feed-top-critics'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/leaderboard?limit=4`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const critics = (data ?? []).slice(0, 4).map((entry: any, i: number) => ({
    id: entry.user.id,
    name: entry.user.nameEn,
    nameAr: entry.user.nameAr,
    avatar: entry.user.avatarUrl || `https://i.pravatar.cc/40?u=${entry.user.id}`,
    badge: CRITIC_BADGES[i] ?? '⭐',
    reviews: entry.reviewCount,
    levelTitle: entry.user.levelTitle || 'Food Explorer',
  }));

  const displayCritics = critics;

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground text-sm">{t('Top Food Critics', 'أبرز نقاد الطعام')}</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-4 h-3 bg-muted rounded" />
              <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : displayCritics.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t('No critics yet', 'لا يوجد نقاد بعد')}</p>
      ) : (
        <div className="space-y-3">
          {displayCritics.map((critic: (typeof displayCritics)[0], i: number) => (
            <Link key={critic.id} href="/leaderboard">
              <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-1 transition-colors cursor-pointer">
                <span className="text-xs font-black text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                <img src={critic.avatar} alt={critic.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? critic.nameAr : critic.name}</p>
                    <span className="text-sm">{critic.badge}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{critic.reviews} {t('reviews', 'تقييم')} · {critic.levelTitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link href="/leaderboard">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('View all critics', 'عرض جميع النقاد')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function TrendingRestaurantsCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ['feed-trending-restaurants'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/restaurants?limit=3&sortBy=topRated`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const restaurants = (data?.restaurants ?? []).slice(0, 3);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-foreground text-sm">{t('Trending This Week', 'الأكثر رواجاً هذا الأسبوع')}</h3>
      </div>
      {restaurants.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t('No trending restaurants yet', 'لا توجد مطاعم رائجة بعد')}</p>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r: any) => (
            <Link key={r.id} href={`/restaurants/${r.id}`}>
              <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-2xl p-1.5 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                  <img src={r.coverImageUrl ?? r.image ?? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'} alt={r.nameEn} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? (r.nameAr ?? r.nameEn) : r.nameEn}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">{Number(r.avgRating ?? r.rating ?? 0).toFixed(1)} · {r.cityNameEn ?? r.city ?? 'Riyadh'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                  <ArrowUp className="w-2.5 h-2.5" />{r.trend ?? '+12%'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Link href="/restaurants">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('Explore restaurants', 'استكشف المطاعم')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function TrendingDishesCard({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  const { data } = useQuery({
    queryKey: ['feed-trending-dishes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dishes/trending?limit=3`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  const dishes = (Array.isArray(data) ? data : data?.dishes ?? []).slice(0, 3);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground text-sm">{t("Today's Top Dishes", 'أفضل الأطباق اليوم')}</h3>
      </div>
      {dishes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t('No dishes yet', 'لا توجد أطباق بعد')}</p>
      ) : (
      <div className="space-y-3">
        {dishes.map((dish: any, i: number) => (
          <Link key={dish.id ?? i} href={dish.restaurantId ? `/restaurants/${dish.restaurantId}` : '/restaurants'}>
            <div className="flex items-center gap-3 hover:bg-secondary/40 rounded-xl p-1 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <img src={dish.imageUrl ?? dish.image ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop'} alt={dish.nameEn} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{lang === 'ar' ? (dish.nameAr ?? dish.nameEn) : dish.nameEn}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {dish.restaurant ?? dish.restaurantNameEn ?? '—'}
                  {dish.price ? ` · ${dish.price}` : dish.priceSar ? ` · ${dish.priceSar} SAR` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(dish.avgRating ?? 0).toFixed(1)}
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
      <Link href="/dishes">
        <button className="w-full mt-3 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
          {t('Browse all dishes', 'تصفح جميع الأطباق')} <ChevronRight className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

function QuickShareCTA({ t, lang }: { t: (en: string, ar: string) => string; lang: string }) {
  return (
    <Link href="/restaurants">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">{t('Share your dining experience', 'شارك تجربتك')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Visit a restaurant and leave a review', 'زر مطعماً واترك تقييمك')}</p>
        </div>
        <Plus className="w-5 h-5 text-primary shrink-0" />
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { lang } = useLanguage();
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('community');
  const [seenGroupIds, setSeenGroupIds] = useState<Set<number>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const { data: storiesData } = useQuery({
    queryKey: ['stories-recent'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/stories/recent?limit=30`);
      if (!res.ok) return { stories: [] };
      return res.json();
    },
  });

  const storyGroups = React.useMemo<StoryGroup[]>(() => {
    const rawStories: any[] = storiesData?.stories ?? [];
    const grouped = new Map<number, any[]>();
    for (const s of rawStories) {
      const rid = s.restaurantId ?? 0;
      if (!grouped.has(rid)) grouped.set(rid, []);
      grouped.get(rid)!.push(s);
    }
    const restaurantGroups: StoryGroup[] = Array.from(grouped.entries()).map(([rid, stories]) => {
      const first = stories[0];
      return {
        id: rid,
        kind: 'restaurant' as const,
        nameEn: first.restaurantNameEn ?? 'Restaurant',
        nameAr: first.restaurantNameAr ?? 'مطعم',
        avatar: first.restaurantLogoUrl ?? `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop`,
        seen: seenGroupIds.has(rid),
        stories: stories.map((s: any) => ({
          id: s.id,
          image: Array.isArray(s.mediaUrls) && s.mediaUrls.length > 0
            ? s.mediaUrls[0]
            : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=1000&fit=crop',
          type: 'checkin' as const,
          typeEn: 'Story',
          typeAr: 'قصة',
          captionEn: s.captionEn ?? '',
          captionAr: s.captionAr ?? '',
          restaurantId: s.restaurantId,
          restaurantEn: s.restaurantNameEn ?? '',
          restaurantAr: s.restaurantNameAr ?? '',
        })),
      };
    });
    const myGroup: StoryGroup = {
      id: 0,
      kind: 'user',
      nameEn: 'Your Story',
      nameAr: 'قصتك',
      avatar: user?.avatarUrl ?? `https://i.pravatar.cc/80?u=${user?.id ?? 'me'}`,
      isMe: true,
      seen: true,
      stories: [],
    };
    return [myGroup, ...restaurantGroups];
  }, [storiesData, seenGroupIds, user]);

  const openStory = useCallback((groupIndex: number) => {
    setViewerStartIndex(groupIndex);
    setViewerOpen(true);
  }, []);

  const closeStory = useCallback(() => {
    setViewerOpen(false);
    const group = storyGroups[viewerStartIndex];
    if (group) setSeenGroupIds(prev => new Set([...prev, group.id]));
  }, [viewerStartIndex, storyGroups]);

  const { data: feedData, isLoading: feedLoading } = useGetFeed(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/feed', { limit: 30 }],
        enabled: !!user && tab === 'following',
      },
    }
  );

  const { data: communityData, isLoading: communityLoading } = useListReviews(
    { limit: 30 },
    {
      query: {
        queryKey: ['/api/reviews', { limit: 30 }],
        enabled: tab === 'community',
      },
    }
  );

  const liveReviews = tab === 'following' ? feedData?.reviews : communityData?.reviews;
  const isLoading = tab === 'following' ? feedLoading : communityLoading;

  const storiesWithStories = storyGroups.filter(g => g.isMe || g.stories.length > 0);

  return (
    <>
      {/* Story Viewer overlay */}
      {viewerOpen && (
        <StoryViewer
          groups={storiesWithStories.filter(g => !g.isMe)}
          startGroupIndex={Math.max(0, viewerStartIndex - 1)}
          onClose={closeStory}
          lang={lang}
          t={t}
        />
      )}

      <div className="min-h-screen bg-background pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                <span className="text-3xl">🍽️</span>
                {t('Food Feed', 'تغذية الطعام')}
              </h1>
              <Link href="/restaurants">
                <Button size="sm" className="rounded-2xl gap-2">
                  <Plus className="w-4 h-4" />
                  {t('Write Review', 'اكتب تقييماً')}
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">{t('Discover what the food community is saying', 'اكتشف ما يقوله مجتمع الطعام')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5">

              {/* ── Stories Strip ─────────────────────────── */}
              <StoriesStrip
                groups={storiesWithStories}
                onOpen={openStory}
                t={t}
                lang={lang}
              />

              <QuickShareCTA t={t} lang={lang} />

              {/* Tab bar */}
              <div className="flex gap-1 bg-muted rounded-2xl p-1">
                {([
                  { id: 'community' as FeedTab, label: t('Community', 'المجتمع'), icon: TrendingUp },
                  { id: 'following' as FeedTab, label: t('Following', 'المتابَعون'), icon: Users },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Following unauthenticated */}
              {tab === 'following' && !user && (
                <div className="text-center py-20 bg-card border border-border/60 rounded-3xl">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{t('Sign in to see your feed', 'سجّل دخولك لرؤية تغذيتك')}</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    {t('Follow food critics and see their latest reviews in real-time.', 'تابع نقاد الطعام وشاهد تقييماتهم الأخيرة لحظة بلحظة.')}
                  </p>
                  <Link href="/signin"><Button className="rounded-2xl">{t('Sign In', 'تسجيل الدخول')}</Button></Link>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="space-y-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border/60 rounded-3xl overflow-hidden animate-pulse">
                      <div className="h-48 bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-32" />
                            <div className="h-2.5 bg-muted rounded w-24" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-full" />
                          <div className="h-3 bg-muted rounded w-4/5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Live API reviews */}
              {!isLoading && liveReviews && liveReviews.length > 0 && (
                <div className="space-y-5">
                  {liveReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} showTarget />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && (!liveReviews || liveReviews.length === 0) && (tab === 'community' || (tab === 'following' && !!user)) && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                    <Utensils className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {tab === 'following'
                      ? t('No posts from people you follow yet', 'لا توجد منشورات ممن تتابعهم بعد')
                      : t('No reviews yet', 'لا توجد تقييمات بعد')}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {tab === 'following'
                      ? t('Follow food lovers to see their reviews and check-ins here.', 'تابع محبي الطعام لرؤية تقييماتهم هنا.')
                      : t('Be the first to share your dining experience.', 'كن أول من يشارك تجربته في المطعم.')}
                  </p>
                  <Link href="/restaurants">
                    <Button variant="outline" className="rounded-2xl gap-2">
                      <Search className="w-4 h-4" />
                      {t('Discover restaurants', 'اكتشف المطاعم')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-5">
              <TrendingRestaurantsCard t={t} lang={lang} />
              <PeopleYouMayKnowCard t={t} lang={lang} />
              <TrendingCriticsCard t={t} lang={lang} />
              <TrendingDishesCard t={t} lang={lang} />

              {/* Explore prompt */}
              <div className="bg-gradient-to-br from-primary to-violet-600 rounded-3xl p-5 text-white">
                <p className="font-extrabold text-lg mb-1">{t('Ready to explore?', 'مستعد للاستكشاف؟')}</p>
                <p className="text-white/80 text-sm mb-4">{t('Book a table at Riyadh\'s best restaurants.', 'احجز طاولة في أفضل مطاعم الرياض.')}</p>
                <Link href="/restaurants">
                  <button className="bg-white text-primary font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-white/90 transition-colors w-full">
                    {t('Find a Restaurant', 'ابحث عن مطعم')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
