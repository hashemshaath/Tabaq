import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  Gift, Copy, CheckCircle2, Share2, MessageSquare,
  ExternalLink, Star, Users, TrendingUp, Award,
  ChevronRight, ArrowRight, Zap, Clock, Info,
  Twitter, Send
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────
interface ReferralStats {
  invitesSent: number;
  converted: number;
  totalPointsEarned: number;
  pendingPoints: number;
}

interface Conversion {
  id: number;
  status: 'pending' | 'signed_up' | 'converted' | 'expired';
  createdAt: string;
  convertedAt: string | null;
  referrerPointsEarned: number;
}

interface PointsTransaction {
  id: number;
  action: string;
  points: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

// ─── Mock data for unauthenticated preview ─────────────────────────
const MOCK_REFERRAL = {
  referralCode: 'TABAQAHMED',
  referralLink: `${window.location.origin}/join?ref=TABAQAHMED`,
  stats: { invitesSent: 12, converted: 7, totalPointsEarned: 700, pendingPoints: 100 } as ReferralStats,
  conversions: [
    { id: 1, status: 'converted' as const, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 86400000).toISOString(), referrerPointsEarned: 100 },
    { id: 2, status: 'converted' as const, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 4 * 86400000).toISOString(), referrerPointsEarned: 100 },
    { id: 3, status: 'signed_up' as const, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), convertedAt: null, referrerPointsEarned: 0 },
    { id: 4, status: 'pending' as const, createdAt: new Date(Date.now() - 3600000).toISOString(), convertedAt: null, referrerPointsEarned: 0 },
  ] as Conversion[],
  pointsPerReferral: 100,
  pointsForReferred: 50,
};

const MOCK_HISTORY: PointsTransaction[] = [
  { id: 1, action: 'referral_converted', points: 100, balanceAfter: 700, description: 'Referral bonus: friend joined', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, action: 'review_written', points: 20, balanceAfter: 600, description: 'Review for Najd Village', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 3, action: 'booking_made', points: 10, balanceAfter: 580, description: 'Table reservation confirmed', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 4, action: 'referral_converted', points: 100, balanceAfter: 570, description: 'Referral bonus: friend joined', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 5, action: 'voucher_purchased', points: 50, balanceAfter: 470, description: 'Voucher purchase reward', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
];

// ─── Action icons & labels ─────────────────────────────────────────
function getActionMeta(action: string): { label: string; labelAr: string; color: string; icon: React.ReactNode } {
  const map: Record<string, { label: string; labelAr: string; color: string; icon: React.ReactNode }> = {
    referral_converted: { label: 'Referral Bonus', labelAr: 'مكافأة الإحالة', color: 'text-violet-600 bg-violet-50', icon: <Gift className="w-3.5 h-3.5" /> },
    referral_signup: { label: 'Welcome Bonus', labelAr: 'مكافأة الترحيب', color: 'text-emerald-600 bg-emerald-50', icon: <Zap className="w-3.5 h-3.5" /> },
    review_written: { label: 'Review Written', labelAr: 'تقييم مكتوب', color: 'text-amber-600 bg-amber-50', icon: <Star className="w-3.5 h-3.5" /> },
    booking_made: { label: 'Booking Made', labelAr: 'حجز تم', color: 'text-blue-600 bg-blue-50', icon: <Clock className="w-3.5 h-3.5" /> },
    voucher_purchased: { label: 'Voucher Purchase', labelAr: 'شراء كوبون', color: 'text-purple-600 bg-purple-50', icon: <Award className="w-3.5 h-3.5" /> },
    email_verified: { label: 'Email Verified', labelAr: 'تحقق من البريد', color: 'text-teal-600 bg-teal-50', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    redemption: { label: 'Points Redeemed', labelAr: 'استبدال نقاط', color: 'text-red-600 bg-red-50', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  };
  return map[action] ?? { label: action, labelAr: action, color: 'text-muted-foreground bg-secondary', icon: <Zap className="w-3.5 h-3.5" /> };
}

function getStatusMeta(status: string): { label: string; color: string } {
  if (status === 'converted') return { label: 'Completed', color: 'text-emerald-600 bg-emerald-50' };
  if (status === 'signed_up') return { label: 'Signed Up', color: 'text-blue-600 bg-blue-50' };
  if (status === 'pending') return { label: 'Pending', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Expired', color: 'text-muted-foreground bg-secondary' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Main page ─────────────────────────────────────────────────────
export function ReferralPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'friends'>('overview');
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const data = MOCK_REFERRAL;
  const history = MOCK_HISTORY;

  const copy = (type: 'code' | 'link') => {
    const text = type === 'code' ? data.referralCode : data.referralLink;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareViaWhatsApp = () => {
    const msg = encodeURIComponent(`${t('Join Tabaq with my invite link and get 50 free points!', 'انضم إلى طبق عبر رابطي واحصل على 50 نقطة مجاناً!')} ${data.referralLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareViaTwitter = () => {
    const msg = encodeURIComponent(`Discover amazing restaurants in Saudi Arabia with @tabaq_sa 🍽️ Use my invite link for 50 bonus points! ${data.referralLink}`);
    window.open(`https://x.com/intent/tweet?text=${msg}`, '_blank');
  };

  const applyPromoCode = () => {
    setPromoStatus('loading');
    setTimeout(() => {
      if (promoInput.toUpperCase() === 'TABAQ50') {
        setPromoStatus('success');
      } else {
        setPromoStatus('error');
      }
    }, 800);
  };

  const LEVEL_NEXT = [0, 100, 500, 1500, 5000];
  const level = user ? 2 : 2;
  const points = data.stats.totalPointsEarned;
  const nextLevelPoints = LEVEL_NEXT[level] ?? 5000;
  const prevLevelPoints = LEVEL_NEXT[level - 1] ?? 0;
  const progress = Math.min(((points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-950 via-primary to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
              <Gift className="w-3.5 h-3.5" />
              {t('Referral & Rewards Program', 'برنامج الإحالة والمكافآت')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight mb-3">
              {t('Invite Friends, Earn Points', 'ادعُ أصدقاءك، اكسب نقاطاً')}
            </h1>
            <p className="text-purple-100 text-base max-w-xl mx-auto leading-relaxed">
              {t(
                `You earn ${data.pointsPerReferral} points for every friend who joins. They get ${data.pointsForReferred} points as a welcome bonus.`,
                `تكسب ${data.pointsPerReferral} نقطة لكل صديق ينضم. ويحصل على ${data.pointsForReferred} نقطة كمكافأة ترحيب.`
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('Friends Invited', 'أصدقاء دعوتهم'), val: data.stats.invitesSent, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: t('Converted', 'انضم'), val: data.stats.converted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t('Points Earned', 'نقاط مكتسبة'), val: data.stats.totalPointsEarned, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: t('Per Referral', 'لكل إحالة'), val: `+${data.pointsPerReferral}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-black text-foreground leading-none mb-1">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Code Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm mb-5 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground mb-0.5">{t('Your Referral Code', 'كود الإحالة الخاص بك')}</h2>
                <p className="text-sm text-muted-foreground">{t('Share it with friends to earn rewards', 'شاركه مع أصدقائك لتكسب مكافآت')}</p>
              </div>
              <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-violet-600" />
              </div>
            </div>

            {/* Code display */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gradient-to-r from-violet-50 to-purple-50 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="font-mono font-black text-xl text-primary tracking-[0.12em]">{data.referralCode}</span>
                <button onClick={() => copy('code')} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copied === 'code' ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                  {copied === 'code' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'code' ? t('Copied!', 'تم النسخ!') : t('Copy', 'نسخ')}
                </button>
              </div>
            </div>

            {/* Link */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 bg-secondary rounded-xl px-3.5 py-2.5 flex items-center gap-2 min-w-0">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate font-mono">{data.referralLink}</span>
              </div>
              <button onClick={() => copy('link')} className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shrink-0 ${copied === 'link' ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}>
                {copied === 'link' ? <CheckCircle2 className="w-3.5 h-3.5" /> : t('Copy Link', 'نسخ الرابط')}
              </button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => copy('link')}
                className="flex items-center justify-center gap-2 py-2.5 bg-secondary rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" />
                {t('Copy', 'نسخ')}
              </button>
              <button onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 bg-[#25d366]/10 rounded-xl text-sm font-semibold text-[#128c4a] hover:bg-[#25d366]/20 transition-colors">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </button>
              <button onClick={shareViaTwitter}
                className="flex items-center justify-center gap-2 py-2.5 bg-foreground/5 rounded-xl text-sm font-semibold text-foreground hover:bg-foreground/10 transition-colors">
                <ExternalLink className="w-4 h-4" />
                X / Twitter
              </button>
            </div>
          </div>

          <div className="border-t border-border/60 px-5 py-3 bg-secondary/20 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {t(
                `Your friend must sign up using your link or code. You earn ${data.pointsPerReferral} points once they make their first reservation.`,
                `يجب على صديقك التسجيل عبر رابطك أو كودك. تكسب ${data.pointsPerReferral} نقطة عند أول حجز لهم.`
              )}
            </p>
          </div>
        </div>

        {/* Have a promo code? */}
        <div className="bg-card rounded-xl border border-border shadow-sm mb-5 p-5">
          <h2 className="text-sm font-bold text-foreground mb-1">{t('Have a referral code?', 'لديك كود إحالة؟')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t(`Enter a friend's code to get ${data.pointsForReferred} bonus points`, `أدخل كود صديقك للحصول على ${data.pointsForReferred} نقطة مكافأة`)}</p>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoStatus('idle'); }}
              placeholder={t('Enter referral code...', 'أدخل كود الإحالة...')}
              className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase placeholder:uppercase placeholder:font-sans placeholder:tracking-normal tracking-widest"
            />
            <button
              onClick={applyPromoCode}
              disabled={!promoInput.trim() || promoStatus === 'loading' || promoStatus === 'success'}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {promoStatus === 'loading' ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : t('Apply', 'تطبيق')}
            </button>
          </div>
          {promoStatus === 'success' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t(`Code applied! +${data.pointsForReferred} points added to your account`, `تم تطبيق الكود! +${data.pointsForReferred} نقطة أضيفت لحسابك`)}
            </div>
          )}
          {promoStatus === 'error' && (
            <p className="mt-2 text-xs text-red-500">{t('Invalid or already used code.', 'كود غير صحيح أو تم استخدامه من قبل.')}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 mb-5">
          {(['overview', 'history', 'friends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'overview' && t('How it Works', 'كيف يعمل')}
              {tab === 'history' && t('Points History', 'سجل النقاط')}
              {tab === 'friends' && t('My Invites', 'دعواتي')}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 mb-10">
            {/* How it works steps */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-bold text-foreground mb-4">{t('How it works', 'كيف يعمل')}</h2>
              <div className="space-y-4">
                {[
                  { step: 1, icon: Share2, title: t('Share your code', 'شارك كودك'), desc: t('Send your unique code or link to friends via WhatsApp, SMS, or social media.', 'أرسل كودك الفريد أو رابطك للأصدقاء عبر واتساب أو الرسائل أو مواقع التواصل.'), color: 'bg-blue-50 text-blue-600' },
                  { step: 2, icon: Users, title: t('Friend signs up', 'صديقك يسجل'), desc: t('Your friend creates a Tabaq account using your link or enters your code during signup.', 'يقوم صديقك بإنشاء حساب طبق باستخدام رابطك أو إدخال كودك عند التسجيل.'), color: 'bg-purple-50 text-purple-600' },
                  { step: 3, icon: Zap, title: t('Both earn points', 'كلاكما يكسب نقاطاً'), desc: t(`You get +${data.pointsPerReferral} pts when they make their first booking. They get +${data.pointsForReferred} pts as a welcome gift.`, `تحصل على +${data.pointsPerReferral} نقطة عند أول حجز لهم. ويحصلون على +${data.pointsForReferred} نقطة هدية ترحيب.`), color: 'bg-emerald-50 text-emerald-600' },
                  { step: 4, icon: Award, title: t('Redeem for rewards', 'استبدل بمكافآت'), desc: t('Use points for exclusive discounts at participating restaurants, free vouchers, and more.', 'استخدم نقاطك للحصول على خصومات حصرية في المطاعم المشاركة وكوبونات مجانية وأكثر.'), color: 'bg-amber-50 text-amber-600' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards table */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-bold text-foreground mb-4">{t('Ways to earn points', 'طرق كسب النقاط')}</h2>
              <div className="space-y-2">
                {[
                  { action: t('Write a review', 'كتابة تقييم'), points: '+20', icon: Star, color: 'text-amber-500' },
                  { action: t('Make a reservation', 'إجراء حجز'), points: '+10', icon: Clock, color: 'text-blue-500' },
                  { action: t('Purchase a voucher', 'شراء كوبون'), points: '+50', icon: Award, color: 'text-purple-500' },
                  { action: t('Invite a friend (first booking)', 'دعوة صديق (أول حجز)'), points: `+${data.pointsPerReferral}`, icon: Users, color: 'text-violet-600' },
                  { action: t('Verify your email', 'التحقق من البريد'), points: '+15', icon: CheckCircle2, color: 'text-emerald-500' },
                ].map(row => (
                  <div key={row.action} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <row.icon className={`w-4 h-4 ${row.color} shrink-0`} />
                      <span className="text-sm text-foreground">{row.action}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{row.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Points History */}
        {activeTab === 'history' && (
          <div className="bg-card rounded-xl border border-border shadow-sm mb-10 overflow-hidden">
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">{t('Points History', 'سجل النقاط')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t('All your point transactions', 'جميع معاملات نقاطك')}</p>
              </div>
              <div className="text-end">
                <p className="text-xs text-muted-foreground">{t('Current Balance', 'الرصيد الحالي')}</p>
                <p className="text-xl font-black text-primary">{data.stats.totalPointsEarned} <span className="text-xs font-medium text-muted-foreground">pts</span></p>
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {history.map(tx => {
                const meta = getActionMeta(tx.action);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-8 h-8 ${meta.color} rounded-lg flex items-center justify-center shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? meta.labelAr : meta.label}</p>
                      {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`text-sm font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Friends */}
        {activeTab === 'friends' && (
          <div className="bg-card rounded-xl border border-border shadow-sm mb-10 overflow-hidden">
            <div className="p-5 border-b border-border/60">
              <h2 className="text-base font-bold text-foreground">{t('My Invites', 'دعواتي')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.stats.converted} {t('of', 'من')} {data.stats.invitesSent} {t('friends converted', 'أصدقاء انضموا')}
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {data.conversions.map((conv, i) => {
                const status = getStatusMeta(conv.status);
                return (
                  <div key={conv.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-muted-foreground">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                        {conv.referrerPointsEarned > 0 && (
                          <span className="text-[11px] font-bold text-emerald-600">+{conv.referrerPointsEarned} pts</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('Invited', 'دُعي')} {timeAgo(conv.createdAt)}</p>
                    </div>
                    {conv.status === 'converted' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {conv.status === 'pending' && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
