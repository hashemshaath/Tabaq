import React, { useState, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import {
  Phone, Mail, KeyRound, Loader2, ChevronRight, ArrowLeft,
  CheckCircle2, Lock, Eye, EyeOff, User, RotateCcw, ShieldCheck,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type AuthTab   = 'phone' | 'email_otp' | 'password';
type OtpStep   = 'identifier' | 'otp';
type ForgotStep = 'email' | 'otp' | 'new_password' | 'done';

const BASE = import.meta.env.BASE_URL ?? '/';
function api(path: string) { return `${BASE}api${path}`; }

// ─────────────────────────────────────────────────────────────────────────────
// OTP boxes sub-component
// ─────────────────────────────────────────────────────────────────────────────
function OtpBoxes({ otp, onChange, onKeyDown, onPaste, refs }: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <div className="flex justify-center gap-3" dir="ltr" onPaste={onPaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev hint banner
// ─────────────────────────────────────────────────────────────────────────────
function DevBanner({ code, label }: { code: string; label: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
      <p className="text-xs text-amber-700 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-[0.3em] text-amber-700">{code}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error banner
// ─────────────────────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function SignInPage() {
  const { t, lang } = useLanguage();
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  // ── OTP login state ───────────────────────────────────────────────────────
  const [tab, setTab]         = useState<AuthTab>('phone');
  const [otpStep, setOtpStep] = useState<OtpStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ── Password login state ──────────────────────────────────────────────────
  const [pwdIdentifier, setPwdIdentifier] = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  // ── Forgot password state ─────────────────────────────────────────────────
  const [forgotOpen, setForgotOpen]         = useState(false);
  const [forgotStep, setForgotStep]         = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotOtp, setForgotOtp]           = useState(['', '', '', '', '', '']);
  const [forgotDevCode, setForgotDevCode]   = useState<string | null>(null);
  const [resetToken, setResetToken]         = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const forgotOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  if (user) { setLocation('/'); return null; }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const resetOtp = () => { setOtp(['', '', '', '', '', '']); };
  const resetForgotOtp = () => { setForgotOtp(['', '', '', '', '', '']); };

  function handleOtpChange(arr: string[], setArr: (v: string[]) => void, refs: React.MutableRefObject<Array<HTMLInputElement | null>>, i: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...arr];
    next[i] = digit;
    setArr(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(arr: string[], refs: React.MutableRefObject<Array<HTMLInputElement | null>>, i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !arr[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handleOtpPaste(setArr: (v: string[]) => void, refs: React.MutableRefObject<Array<HTMLInputElement | null>>, e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setArr(pasted.split('')); refs.current[5]?.focus(); }
    e.preventDefault();
  }

  async function finishLogin(token: string, userData: object) {
    login(token, userData);
    const pendingRef = localStorage.getItem('tabaq_referral_code');
    if (pendingRef) {
      try {
        await fetch(api('/referrals/use'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ referralCode: pendingRef }),
        });
      } catch { /* silent */ }
      localStorage.removeItem('tabaq_referral_code');
    }
    setLocation('/');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP login — send code
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const body = tab === 'email_otp'
        ? { email: identifier.trim() }
        : { phone: identifier.trim() };
      const res  = await fetch(api('/auth/request-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Something went wrong', 'حدث خطأ ما')); return; }
      if (data.devCode) setDevCode(data.devCode);
      setOtpStep('otp');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP login — verify code
  // ─────────────────────────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const body = tab === 'email_otp'
        ? { email: identifier.trim(), code }
        : { phone: identifier.trim(), code };
      const res  = await fetch(api('/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'otp_attempt_limit') {
          setError(t('Too many failed attempts. Please request a new code.', 'محاولات فاشلة كثيرة. يرجى طلب رمز جديد.'));
          setOtpStep('identifier'); resetOtp(); setDevCode(null);
        } else {
          setError(data.message || t('Invalid code', 'رمز غير صحيح'));
        }
        return;
      }
      await finishLogin(data.token ?? data.accessToken, data.user);
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password login
  // ─────────────────────────────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pwdIdentifier.trim() || !password) return;
    setLoading(true);
    try {
      const id = pwdIdentifier.trim();
      const body = id.includes('@')
        ? { email: id, password }
        : id.match(/^\+?\d/)
          ? { phone: id, password }
          : { username: id, password };

      const res  = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'ACCOUNT_LOCKED') {
          setError(t(`Account locked. Try again in ${Math.ceil((data.retry_after ?? 300) / 60)} minutes.`, `الحساب مقفل. حاول بعد ${Math.ceil((data.retry_after ?? 300) / 60)} دقيقة.`));
        } else {
          setError(data.message || t('Invalid credentials', 'بيانات الدخول غير صحيحة'));
        }
        return;
      }
      await finishLogin(data.accessToken ?? data.token, data.user);
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot password — step 1: send OTP to email
  // ─────────────────────────────────────────────────────────────────────────
  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/forgot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Something went wrong', 'حدث خطأ ما')); return; }
      if (data.devCode) setForgotDevCode(data.devCode);
      setForgotStep('otp');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot password — step 2: verify OTP → get reset_token
  // ─────────────────────────────────────────────────────────────────────────
  async function handleForgotVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = forgotOtp.join('');
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t('Invalid or expired code', 'رمز غير صحيح أو منتهي الصلاحية'));
        if (data.error === 'otp_voided') { resetForgotOtp(); setForgotStep('email'); }
        return;
      }
      setResetToken(data.reset_token);
      setForgotStep('new_password');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot password — step 3: set new password
  // ─────────────────────────────────────────────────────────────────────────
  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("Passwords don't match", 'كلمتا المرور غير متطابقتين'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('Password must be at least 8 characters', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'));
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (data.requirements ? data.requirements.join(', ') : t('Password reset failed', 'فشل إعادة تعيين كلمة المرور')));
        return;
      }
      setForgotStep('done');
    } catch {
      setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.'));
    } finally { setLoading(false); }
  }

  function openForgot() {
    setForgotOpen(true);
    setForgotStep('email');
    setForgotEmail(pwdIdentifier.includes('@') ? pwdIdentifier : '');
    setForgotDevCode(null);
    resetForgotOtp();
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }

  function closeForgot() {
    setForgotOpen(false);
    setError(null);
  }

  function switchTab(t: AuthTab) {
    setTab(t);
    setOtpStep('identifier');
    setIdentifier('');
    resetOtp();
    setDevCode(null);
    setError(null);
    setForgotOpen(false);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────
  const isRtl = lang === 'ar';

  const TABS: { id: AuthTab; icon: React.ElementType; en: string; ar: string }[] = [
    { id: 'phone',     icon: Phone, en: 'Phone',    ar: 'هاتف' },
    { id: 'email_otp', icon: Mail,  en: 'Email OTP', ar: 'بريد + OTP' },
    { id: 'password',  icon: Lock,  en: 'Password',  ar: 'كلمة المرور' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot Password overlay content
  // ─────────────────────────────────────────────────────────────────────────
  const forgotContent = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          type="button"
          onClick={forgotStep === 'done' ? closeForgot : () => {
            if (forgotStep === 'email') closeForgot();
            else if (forgotStep === 'otp') { setForgotStep('email'); setError(null); resetForgotOtp(); }
            else if (forgotStep === 'new_password') { setForgotStep('otp'); setError(null); }
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <h3 className="text-lg font-bold">
            {forgotStep === 'email'       && t('Reset your password', 'إعادة تعيين كلمة المرور')}
            {forgotStep === 'otp'         && t('Check your email', 'تحقق من بريدك الإلكتروني')}
            {forgotStep === 'new_password'&& t('Set new password', 'تعيين كلمة مرور جديدة')}
            {forgotStep === 'done'        && t('Password reset!', 'تم إعادة التعيين!')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {forgotStep === 'email'        && t('Enter the email linked to your account', 'أدخل البريد الإلكتروني المرتبط بحسابك')}
            {forgotStep === 'otp'          && t(`We sent a 6-digit code to ${forgotEmail}`, `أرسلنا رمزاً من 6 أرقام إلى ${forgotEmail}`)}
            {forgotStep === 'new_password' && t('Choose a strong new password', 'اختر كلمة مرور جديدة قوية')}
            {forgotStep === 'done'         && t('Your password has been updated. You can sign in now.', 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.')}
          </p>
        </div>
      </div>

      {/* Step: email */}
      {forgotStep === 'email' && (
        <form onSubmit={handleForgotSendOtp} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            className="h-12 rounded-xl"
            dir="ltr"
            autoFocus
          />
          {error && <ErrorBanner msg={error} />}
          <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || !forgotEmail.trim()}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Send Reset Code', 'إرسال رمز الاسترداد')}
          </Button>
        </form>
      )}

      {/* Step: OTP */}
      {forgotStep === 'otp' && (
        <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
          {forgotDevCode && <DevBanner code={forgotDevCode} label={t('Dev mode — your reset OTP:', 'وضع التطوير — رمز الاسترداد:')} />}
          <OtpBoxes
            otp={forgotOtp}
            onChange={(i, v) => handleOtpChange(forgotOtp, setForgotOtp, forgotOtpRefs, i, v)}
            onKeyDown={(i, e) => handleOtpKeyDown(forgotOtp, forgotOtpRefs, i, e)}
            onPaste={e => handleOtpPaste(setForgotOtp, forgotOtpRefs, e)}
            refs={forgotOtpRefs}
          />
          {error && <ErrorBanner msg={error} />}
          <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || forgotOtp.join('').length < 6}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Verify Code', 'التحقق من الرمز')}
          </Button>
          <button type="button" onClick={() => { setForgotStep('email'); resetForgotOtp(); setForgotDevCode(null); setError(null); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors">
            {t('← Resend or change email', '← إعادة الإرسال أو تغيير البريد')}
          </button>
        </form>
      )}

      {/* Step: new password */}
      {forgotStep === 'new_password' && (
        <form onSubmit={handleForgotReset} className="space-y-4">
          <div className="relative">
            <Input
              type={showNewPwd ? 'text' : 'password'}
              placeholder={t('New password', 'كلمة المرور الجديدة')}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="h-12 rounded-xl pr-11"
              autoFocus
            />
            <button type="button" onClick={() => setShowNewPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            type={showNewPwd ? 'text' : 'password'}
            placeholder={t('Confirm new password', 'تأكيد كلمة المرور الجديدة')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">{t('Min 8 characters, 1 uppercase, 1 number', 'الحد الأدنى 8 أحرف، حرف كبير، ورقم واحد')}</p>
          {error && <ErrorBanner msg={error} />}
          <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || !newPassword || !confirmPassword}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Reset Password', 'إعادة تعيين كلمة المرور')}
          </Button>
        </form>
      )}

      {/* Step: done */}
      {forgotStep === 'done' && (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <Button onClick={() => { closeForgot(); switchTab('password'); }} className="w-full h-12 rounded-xl font-semibold">
            {t('Sign in with new password', 'تسجيل الدخول بالكلمة الجديدة')}
          </Button>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Main sign-in form content
  // ─────────────────────────────────────────────────────────────────────────
  const mainContent = (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex rounded-2xl border border-border overflow-hidden">
        {TABS.map(({ id, icon: Icon, en, ar }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors
              ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
          >
            <Icon className="w-4 h-4" />
            {lang === 'ar' ? ar : en}
          </button>
        ))}
      </div>

      {/* ── Phone OTP ─────────────────────────────────────────────────── */}
      {(tab === 'phone' || tab === 'email_otp') && (
        <>
          {otpStep === 'identifier' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  {tab === 'phone' ? t('Phone Number', 'رقم الهاتف') : t('Email Address', 'عنوان البريد الإلكتروني')}
                </label>
                <Input
                  type={tab === 'email_otp' ? 'email' : 'tel'}
                  placeholder={tab === 'email_otp' ? 'you@example.com' : '+966 5X XXX XXXX'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-12 rounded-xl"
                  autoFocus
                  dir="ltr"
                />
              </div>
              {error && <ErrorBanner msg={error} />}
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || !identifier.trim()}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {t('Send Verification Code', 'إرسال رمز التحقق')}
                    <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {devCode && <DevBanner code={devCode} label={t('Dev mode — your OTP:', 'وضع التطوير — رمزك:')} />}
              <OtpBoxes
                otp={otp}
                onChange={(i, v) => handleOtpChange(otp, setOtp, otpRefs, i, v)}
                onKeyDown={(i, e) => handleOtpKeyDown(otp, otpRefs, i, e)}
                onPaste={e => handleOtpPaste(setOtp, otpRefs, e)}
                refs={otpRefs}
              />
              {error && <ErrorBanner msg={error} />}
              <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || otp.join('').length < 6}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('Verify & Sign In', 'تحقق وتسجيل الدخول')}
                  </span>
                )}
              </Button>
              <button type="button" onClick={() => { setOtpStep('identifier'); resetOtp(); setDevCode(null); setError(null); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors">
                {t('← Change contact info', '← تغيير معلومات الاتصال')}
              </button>
            </form>
          )}
        </>
      )}

      {/* ── Password login ─────────────────────────────────────────────── */}
      {tab === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">
              {t('Email or username', 'البريد الإلكتروني أو اسم المستخدم')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('Email, username, or phone', 'البريد أو اسم المستخدم أو الهاتف')}
                value={pwdIdentifier}
                onChange={e => setPwdIdentifier(e.target.value)}
                className="h-12 rounded-xl pl-10"
                autoFocus
                dir="ltr"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">{t('Password', 'كلمة المرور')}</label>
              <button type="button" onClick={openForgot}
                className="text-xs text-primary hover:underline font-medium">
                {t('Forgot password?', 'نسيت كلمة المرور؟')}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 rounded-xl pl-10 pr-11"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <ErrorBanner msg={error} />}
          <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={loading || !pwdIdentifier.trim() || !password}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {t('Sign In', 'تسجيل الدخول')}
              </span>
            )}
          </Button>
        </form>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Page layout
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left decorative panel */}
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
          {/* Restaurant partner link on desktop panel */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/60 text-sm mb-3">{t('Are you a restaurant owner?', 'هل أنت صاحب مطعم؟')}</p>
            <Link href="/partners"
              className="inline-flex items-center gap-2 text-white font-semibold text-sm hover:text-white/80 transition-colors border border-white/30 rounded-xl px-4 py-2 hover:bg-white/10">
              <RotateCcw className="w-4 h-4" />
              {t('Partner with Tabaq →', 'انضم كشريك في طبق ←')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile back link */}
          <Link href="/" className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to home', 'العودة للرئيسية')}
          </Link>

          {/* Header */}
          {!forgotOpen && (
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                {tab === 'phone'     && <Phone className="w-6 h-6 text-primary" />}
                {tab === 'email_otp' && <Mail  className="w-6 h-6 text-primary" />}
                {tab === 'password'  && <Lock  className="w-6 h-6 text-primary" />}
              </div>
              <h2 className="text-3xl font-bold text-foreground">{t('Sign in', 'تسجيل الدخول')}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("New here? We'll create your account automatically.", 'هنا للمرة الأولى؟ سننشئ حسابك تلقائياً.')}
              </p>
            </div>
          )}

          {/* Content: forgot password flow OR main form */}
          {forgotOpen ? forgotContent : mainContent}

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3 text-xs text-muted-foreground">
            <p>{t('By continuing, you agree to our Terms of Service and Privacy Policy.', 'بالمتابعة، توافق على شروط الخدمة وسياسة الخصوصية.')}</p>
            <Link href="/partners"
              className="flex items-center gap-2 text-primary font-medium hover:underline text-sm">
              {t('Restaurant owner? Register your business →', 'صاحب مطعم؟ سجّل مطعمك ←')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
