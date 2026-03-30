import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { Phone, Mail, KeyRound, Loader2, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

type Step = 'identifier' | 'otp';
type AuthMode = 'phone' | 'email';

export function SignInPage() {
  const { t, lang } = useLanguage();
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>('identifier');
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (user) {
    setLocation('/profile');
    return null;
  }

  const isEmail = authMode === 'email';

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const body = isEmail ? { email: identifier.trim() } : { phone: identifier.trim() };
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Something went wrong', 'حدث خطأ ما')); return; }
      if (data.devCode) setDevCode(data.devCode);
      setStep('otp');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const body = isEmail ? { email: identifier.trim(), code } : { phone: identifier.trim(), code };
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'otp_attempt_limit') {
          setError(t('Too many failed attempts. Please request a new code.', 'محاولات فاشلة كثيرة. يرجى طلب رمز جديد.'));
          setStep('identifier'); setOtp(['', '', '', '', '', '']); setDevCode(null);
        } else {
          setError(data.message || t('Invalid code', 'رمز غير صحيح'));
        }
        return;
      }
      login(data.token, data.user);
      setLocation('/');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('identifier');
    setOtp(['', '', '', '', '', '']);
    setDevCode(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Left — decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=900&fit=crop"
          alt="Fine dining"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-black/70" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <ArrowLeft className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">{t('Back to home', 'العودة للرئيسية')}</span>
          </Link>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            {t('Welcome to Tabaq', 'مرحباً بك في طبق')}
          </h1>
          <p className="text-xl text-white/80 leading-relaxed mb-10">
            {t("Saudi Arabia's #1 dining discovery and booking platform.", 'منصة اكتشاف وحجز المطاعم الأولى في المملكة.')}
          </p>
          <div className="space-y-4">
            {[
              { icon: '🍽️', en: 'Book tables at top restaurants', ar: 'احجز طاولات في أفضل المطاعم' },
              { icon: '⭐', en: 'Share reviews and earn points', ar: 'شارك تقييماتك واكسب نقاطاً' },
              { icon: '🎫', en: 'Get exclusive vouchers & offers', ar: 'احصل على قسائم وعروض حصرية' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-base">{lang === 'ar' ? item.ar : item.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to home', 'العودة للرئيسية')}
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {step === 'identifier' ? (
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {isEmail ? <Mail className="w-6 h-6 text-primary" /> : <Phone className="w-6 h-6 text-primary" />}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-green-600" />
                </div>
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {step === 'identifier' ? t('Sign in', 'تسجيل الدخول') : t('Enter your code', 'أدخل الرمز')}
            </h2>
            <p className="text-muted-foreground mt-1">
              {step === 'identifier'
                ? t('New here? We\'ll create your account automatically.', 'هنا للمرة الأولى؟ سننشئ حسابك تلقائياً.')
                : t(`We sent a 6-digit code to ${identifier}`, `أرسلنا رمزاً من 6 أرقام إلى ${identifier}`)
              }
            </p>
          </div>

          {step === 'identifier' ? (
            <form onSubmit={handleIdentifierSubmit} className="space-y-5">
              {/* Toggle */}
              <div className="flex rounded-2xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setAuthMode('phone'); setIdentifier(''); setError(null); }}
                  className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${authMode === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  <Phone className="w-4 h-4" />
                  {t('Phone', 'هاتف')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('email'); setIdentifier(''); setError(null); }}
                  className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${authMode === 'email' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  <Mail className="w-4 h-4" />
                  {t('Email', 'بريد')}
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  {isEmail ? t('Email Address', 'عنوان البريد الإلكتروني') : t('Phone Number', 'رقم الهاتف')}
                </label>
                <Input
                  type={isEmail ? 'email' : 'tel'}
                  placeholder={isEmail ? 'you@example.com' : '+966 5X XXX XXXX'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-13 rounded-xl text-base"
                  autoFocus
                  dir="ltr"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-13 rounded-xl text-base font-semibold" disabled={loading || !identifier.trim()}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {t('Send Verification Code', 'إرسال رمز التحقق')}
                    <ChevronRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('By continuing, you agree to our Terms of Service and Privacy Policy.', 'بالمتابعة، توافق على شروط الخدمة وسياسة الخصوصية.')}
              </p>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {devCode && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-700 font-medium mb-1">{t('Dev mode — your OTP:', 'وضع التطوير — رمزك:')}</p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-amber-700">{devCode}</p>
                </div>
              )}

              <div className="flex justify-center gap-3" dir="ltr" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-13 rounded-xl text-base font-semibold" disabled={loading || otp.join('').length < 6}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('Verify & Sign In', 'تحقق وتسجيل الدخول')}
                  </span>
                )}
              </Button>

              <button type="button" onClick={handleBack} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-1">
                {t('← Change contact info', '← تغيير معلومات الاتصال')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
