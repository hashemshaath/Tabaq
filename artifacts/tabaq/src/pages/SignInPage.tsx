import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import {
  Phone, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft,
  ChevronRight, RotateCcw, CheckCircle2, ShieldCheck,
  Building2, User, ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL ?? '/';
function api(path: string) { return `${BASE}api${path}`; }

type AccountMode = 'user' | 'restaurant' | 'admin';
type UserLoginTab = 'phone' | 'email_otp' | 'password';
type OtpStep = 'identifier' | 'otp';
type ForgotStep = 'email' | 'otp' | 'new_password' | 'done';

// ─────────────────────────────────────────────────────────────────────────────
// Role-aware redirect helper
// ─────────────────────────────────────────────────────────────────────────────
function roleDestination(user: any): string {
  if (user?.isAdmin) return '/admin';
  if (user?.isOwner) return '/console';
  return '/';
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP digit boxes
// ─────────────────────────────────────────────────────────────────────────────
function OtpBoxes({ otp, onChange, onKeyDown, onPaste, refs }: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <div className="flex justify-center gap-2.5" dir="ltr" onPaste={onPaste}>
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
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-white focus:border-primary focus:outline-none transition-all shadow-sm"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev hint
// ─────────────────────────────────────────────────────────────────────────────
function DevBanner({ code }: { code: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
      <p className="text-xs text-amber-600 font-medium mb-1">Dev mode — OTP code</p>
      <p className="text-2xl font-bold tracking-[0.4em] text-amber-700">{code}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error / Success banners
// ─────────────────────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
      <ShieldAlert className="shrink-0 mt-0.5 w-4 h-4" />
      <span>{msg}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Mode Selector
// ─────────────────────────────────────────────────────────────────────────────
function AccountModeSelector({ mode, onChange, lang }: {
  mode: AccountMode;
  onChange: (m: AccountMode) => void;
  lang: string;
}) {
  const modes: { key: AccountMode; icon: React.ReactNode; en: string; ar: string; desc_en: string; desc_ar: string }[] = [
    { key: 'user',       icon: <User className="w-4 h-4" />,       en: 'Customer',   ar: 'عميل',       desc_en: 'Discover & book restaurants', desc_ar: 'اكتشف المطاعم وابحث' },
    { key: 'restaurant', icon: <Building2 className="w-4 h-4" />,  en: 'Restaurant', ar: 'مطعم',       desc_en: 'Manage your business',        desc_ar: 'أدر منشأتك التجارية' },
    { key: 'admin',      icon: <ShieldCheck className="w-4 h-4" />, en: 'Admin',     ar: 'مسؤول',     desc_en: 'Platform administration',     desc_ar: 'إدارة المنصة' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
      {modes.map(m => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all text-xs font-medium ${
            mode === m.key
              ? 'bg-white shadow-md text-primary'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <span className={mode === m.key ? 'text-primary' : 'text-slate-400'}>{m.icon}</span>
          <span className="font-semibold">{lang === 'ar' ? m.ar : m.en}</span>
          <span className={`text-[10px] leading-tight ${mode === m.key ? 'text-slate-500' : 'text-slate-400'}`}>
            {lang === 'ar' ? m.desc_ar : m.desc_en}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ icon, ...props }: { icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      )}
      <input
        {...props}
        className={`w-full h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none transition-all text-sm ${icon ? 'ps-10' : 'ps-4'} pe-4 ${props.className ?? ''}`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary button
// ─────────────────────────────────────────────────────────────────────────────
function PrimaryBtn({ loading, children, ...props }: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      {...props}
      className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function SignInPage() {
  const { t, lang } = useLanguage();
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  // ── Account mode ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AccountMode>('user');

  // ── User login tabs ───────────────────────────────────────────────────────
  const [userTab, setUserTab] = useState<UserLoginTab>('phone');

  // ── OTP state ─────────────────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [otpStep, setOtpStep]       = useState<OtpStep>('identifier');
  const [devCode, setDevCode]       = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ── Password state ────────────────────────────────────────────────────────
  const [pwdEmail, setPwdEmail]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);

  // ── Forgot password ───────────────────────────────────────────────────────
  const [forgotOpen, setForgotOpen]       = useState(false);
  const [forgotStep, setForgotStep]       = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotOtp, setForgotOtp]         = useState(['', '', '', '', '', '']);
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [resetToken, setResetToken]       = useState('');
  const [newPwd, setNewPwd]               = useState('');
  const [confirmPwd, setConfirmPwd]       = useState('');
  const [showNewPwd, setShowNewPwd]       = useState(false);
  const forgotOtpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Clear state on mode switch ───────────────────────────────────────────
  function switchMode(m: AccountMode) {
    setMode(m);
    setError(null);
    setSuccess(null);
    setIdentifier('');
    setOtp(['', '', '', '', '', '']);
    setOtpStep('identifier');
    setDevCode(null);
    setPwdEmail('');
    setPassword('');
    setForgotOpen(false);
  }

  function switchUserTab(tab: UserLoginTab) {
    setUserTab(tab);
    setError(null);
    setIdentifier('');
    setOtp(['', '', '', '', '', '']);
    setOtpStep('identifier');
    setDevCode(null);
  }

  // ─── Redirect already-authenticated users by role ─────────────────────────
  useEffect(() => {
    if (user) setLocation(roleDestination(user));
  }, [user, setLocation]);
  if (user) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // OTP helpers
  // ─────────────────────────────────────────────────────────────────────────
  function handleOtpChange(arr: string[], setArr: (v: string[]) => void, refs: React.MutableRefObject<Array<HTMLInputElement | null>>, i: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...arr]; next[i] = digit; setArr(next);
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

  // ─────────────────────────────────────────────────────────────────────────
  // Core: finish login — role-aware redirect
  // ─────────────────────────────────────────────────────────────────────────
  async function finishLogin(token: string, userData: any, expectedMode?: AccountMode) {
    // Validate role matches selected account type
    if (expectedMode === 'admin' && !userData?.isAdmin) {
      setError(t('This account does not have admin access.', 'هذا الحساب لا يمتلك صلاحيات الإدارة.'));
      return;
    }
    if (expectedMode === 'restaurant' && !userData?.isOwner && !userData?.isAdmin) {
      setError(t('This account is not linked to a restaurant. Please use the Customer login.', 'هذا الحساب غير مرتبط بمطعم. يرجى استخدام تسجيل دخول العملاء.'));
      return;
    }

    login(token, userData);

    // Apply pending referral silently
    const pendingRef = localStorage.getItem('tabaq_referral_code');
    if (pendingRef) {
      fetch(api('/referrals/use'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralCode: pendingRef }),
      }).catch(() => {});
      localStorage.removeItem('tabaq_referral_code');
    }

    setLocation(roleDestination(userData));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP flow — send
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const body = userTab === 'email_otp' ? { email: identifier.trim() } : { phone: identifier.trim() };
      const res  = await fetch(api('/auth/request-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Something went wrong.', 'حدث خطأ ما.')); return; }
      if (data.devCode) setDevCode(data.devCode);
      setOtpStep('otp');
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP flow — verify
  // ─────────────────────────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setError(null); setLoading(true);
    try {
      const body = userTab === 'email_otp' ? { email: identifier.trim(), code } : { phone: identifier.trim(), code };
      const res  = await fetch(api('/auth/verify-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'otp_attempt_limit') {
          setOtpStep('identifier'); setOtp(['', '', '', '', '', '']); setDevCode(null);
          setError(t('Too many attempts. Request a new code.', 'محاولات كثيرة. اطلب رمزاً جديداً.'));
        } else {
          setError(data.message || t('Invalid code.', 'رمز غير صحيح.'));
        }
        return;
      }
      await finishLogin(data.token ?? data.accessToken, data.user, 'user');
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Password login — handles user / restaurant / admin
  // ─────────────────────────────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pwdEmail.trim() || !password) return;
    setLoading(true);
    try {
      const id = pwdEmail.trim();
      const body = id.includes('@')
        ? { email: id, password }
        : id.match(/^\+?\d/) ? { phone: id, password } : { username: id, password };

      const res  = await fetch(api('/auth/login'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === 'ACCOUNT_LOCKED'
          ? t(`Account locked. Try again in ${Math.ceil((data.retry_after ?? 300) / 60)} minutes.`,
              `الحساب مقفل. حاول بعد ${Math.ceil((data.retry_after ?? 300) / 60)} دقيقة.`)
          : data.error === 'no_password'
          ? t('This account uses OTP login. Use the code method instead.', 'هذا الحساب يستخدم رمز OTP. استخدم طريقة الرمز.')
          : data.message || t('Invalid credentials.', 'بيانات الدخول غير صحيحة.');
        setError(msg);
        return;
      }
      await finishLogin(data.accessToken ?? data.token, data.user, mode);
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot password flow
  // ─────────────────────────────────────────────────────────────────────────
  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/forgot'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Something went wrong.', 'حدث خطأ ما.')); return; }
      if (data.devCode) setForgotDevCode(data.devCode);
      setForgotStep('otp');
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  async function handleForgotVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = forgotOtp.join('');
    if (code.length < 6) return;
    setError(null); setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/verify-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t('Invalid or expired code.', 'رمز غير صحيح أو منتهي الصلاحية.'));
        if (data.error === 'otp_voided') { setForgotOtp(['', '', '', '', '', '']); setForgotStep('email'); }
        return;
      }
      setResetToken(data.reset_token);
      setForgotStep('new_password');
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPwd !== confirmPwd) { setError(t('Passwords do not match.', 'كلمتا المرور غير متطابقتين.')); return; }
    if (newPwd.length < 8) { setError(t('Password must be at least 8 characters.', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.')); return; }
    setLoading(true);
    try {
      const res  = await fetch(api('/auth/password/reset'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || t('Reset failed.', 'فشل إعادة التعيين.')); return; }
      setForgotStep('done');
    } catch { setError(t('Network error. Please try again.', 'خطأ في الشبكة. حاول مرة أخرى.')); }
    finally { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Forgot password overlay
  // ─────────────────────────────────────────────────────────────────────────
  function renderForgot() {
    if (forgotStep === 'done') {
      return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{t('Password reset!', 'تم إعادة تعيين كلمة المرور!')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('You can now sign in with your new password.', 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.')}</p>
          </div>
          <button
            type="button"
            onClick={() => { setForgotOpen(false); setForgotStep('email'); setForgotEmail(''); setForgotOtp(['', '', '', '', '', '']); setNewPwd(''); setConfirmPwd(''); }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('Back to sign in', 'العودة لتسجيل الدخول')}
          </button>
        </div>
      );
    }
    if (forgotStep === 'new_password') {
      return (
        <form onSubmit={handleForgotReset} className="flex flex-col gap-4">
          <div className="text-center">
            <h3 className="font-semibold text-slate-900">{t('Set new password', 'تعيين كلمة مرور جديدة')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('Choose a strong password of at least 8 characters.', 'اختر كلمة مرور قوية من 8 أحرف على الأقل.')}</p>
          </div>
          {error && <ErrorBanner msg={error} />}
          <Field label={t('New password', 'كلمة المرور الجديدة')}>
            <div className="relative">
              <TextInput
                icon={<Lock className="w-4 h-4" />}
                type={showNewPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder={t('Minimum 8 characters', '8 أحرف على الأقل')}
                required
              />
              <button type="button" onClick={() => setShowNewPwd(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label={t('Confirm password', 'تأكيد كلمة المرور')}>
            <TextInput
              icon={<Lock className="w-4 h-4" />}
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder={t('Repeat password', 'أعد كلمة المرور')}
              required
            />
          </Field>
          <PrimaryBtn loading={loading}>{t('Reset password', 'إعادة تعيين')}</PrimaryBtn>
        </form>
      );
    }
    if (forgotStep === 'otp') {
      return (
        <form onSubmit={handleForgotVerifyOtp} className="flex flex-col gap-4">
          <div className="text-center">
            <h3 className="font-semibold text-slate-900">{t('Check your email', 'تحقق من بريدك')}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {t(`We sent a code to ${forgotEmail}`, `أرسلنا رمزاً إلى ${forgotEmail}`)}
            </p>
          </div>
          {forgotDevCode && <DevBanner code={forgotDevCode} />}
          {error && <ErrorBanner msg={error} />}
          <OtpBoxes
            otp={forgotOtp}
            onChange={(i, v) => handleOtpChange(forgotOtp, setForgotOtp, forgotOtpRefs, i, v)}
            onKeyDown={(i, e) => handleOtpKeyDown(forgotOtp, forgotOtpRefs, i, e)}
            onPaste={e => handleOtpPaste(setForgotOtp, forgotOtpRefs, e)}
            refs={forgotOtpRefs}
          />
          <PrimaryBtn loading={loading}>{t('Verify code', 'تحقق من الرمز')}</PrimaryBtn>
        </form>
      );
    }
    return (
      <form onSubmit={handleForgotSendOtp} className="flex flex-col gap-4">
        <div className="text-center">
          <h3 className="font-semibold text-slate-900">{t('Reset your password', 'إعادة تعيين كلمة المرور')}</h3>
          <p className="text-sm text-slate-500 mt-1">{t("Enter your account email and we'll send a verification code.", 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق.')}</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <Field label={t('Email address', 'البريد الإلكتروني')}>
          <TextInput
            icon={<Mail className="w-4 h-4" />}
            type="email"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />
        </Field>
        <PrimaryBtn loading={loading}>{t('Send reset code', 'إرسال رمز الاستعادة')}</PrimaryBtn>
        <button type="button" onClick={() => { setForgotOpen(false); setError(null); }} className="text-sm text-slate-500 hover:text-slate-700 text-center">
          {t('Back to sign in', 'العودة لتسجيل الدخول')}
        </button>
      </form>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Password form (shared by all modes)
  // ─────────────────────────────────────────────────────────────────────────
  function renderPasswordForm(showForgot = true) {
    return (
      <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
        {error && <ErrorBanner msg={error} />}
        <Field label={t('Email address', 'البريد الإلكتروني')}>
          <TextInput
            icon={<Mail className="w-4 h-4" />}
            type="email"
            value={pwdEmail}
            onChange={e => { setPwdEmail(e.target.value); setError(null); }}
            placeholder="email@example.com"
            required
            autoFocus
          />
        </Field>
        <Field label={t('Password', 'كلمة المرور')}>
          <div className="relative">
            <TextInput
              icon={<Lock className="w-4 h-4" />}
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              placeholder={t('Your password', 'كلمة المرور')}
              required
            />
            <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        {showForgot && (
          <div className="flex justify-end -mt-1">
            <button type="button" onClick={() => { setForgotOpen(true); setError(null); setForgotEmail(pwdEmail); }} className="text-xs text-primary hover:underline font-medium">
              {t('Forgot password?', 'نسيت كلمة المرور؟')}
            </button>
          </div>
        )}
        <PrimaryBtn loading={loading}>
          <span>{t('Sign in', 'تسجيل الدخول')}</span>
          <ChevronRight className="w-4 h-4" />
        </PrimaryBtn>
      </form>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: User OTP form
  // ─────────────────────────────────────────────────────────────────────────
  function renderUserOtpForm() {
    if (otpStep === 'otp') {
      return (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              {t(`Code sent to ${identifier}`, `تم إرسال رمز إلى ${identifier}`)}
            </p>
          </div>
          {devCode && <DevBanner code={devCode} />}
          {error && <ErrorBanner msg={error} />}
          <OtpBoxes
            otp={otp}
            onChange={(i, v) => handleOtpChange(otp, setOtp, otpRefs, i, v)}
            onKeyDown={(i, e) => handleOtpKeyDown(otp, otpRefs, i, e)}
            onPaste={e => handleOtpPaste(setOtp, otpRefs, e)}
            refs={otpRefs}
          />
          <PrimaryBtn loading={loading}>{t('Verify & sign in', 'تحقق وادخل')}</PrimaryBtn>
          <button type="button" onClick={() => { setOtpStep('identifier'); setOtp(['', '', '', '', '', '']); setDevCode(null); setError(null); }}
            className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <RotateCcw className="w-3.5 h-3.5" /> {t('Change number / Resend', 'تغيير أو إعادة إرسال')}
          </button>
        </form>
      );
    }
    const isEmail = userTab === 'email_otp';
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        {error && <ErrorBanner msg={error} />}
        <Field label={isEmail ? t('Email address', 'البريد الإلكتروني') : t('Mobile number', 'رقم الجوال')}>
          <TextInput
            icon={isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            type={isEmail ? 'email' : 'tel'}
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setError(null); }}
            placeholder={isEmail ? 'email@example.com' : '+966 5X XXX XXXX'}
            dir="ltr"
            required
            autoFocus
          />
        </Field>
        <PrimaryBtn loading={loading}>
          <span>{t('Send code', 'إرسال رمز التحقق')}</span>
          <ChevronRight className="w-4 h-4" />
        </PrimaryBtn>
      </form>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: User panel (tabs: phone | email_otp | password)
  // ─────────────────────────────────────────────────────────────────────────
  function renderUserPanel() {
    const tabs: { key: UserLoginTab; icon: React.ReactNode; label_en: string; label_ar: string }[] = [
      { key: 'phone',     icon: <Phone className="w-3.5 h-3.5" />, label_en: 'Mobile',   label_ar: 'جوال' },
      { key: 'email_otp', icon: <Mail  className="w-3.5 h-3.5" />, label_en: 'Email OTP', label_ar: 'بريد + رمز' },
      { key: 'password',  icon: <Lock  className="w-3.5 h-3.5" />, label_en: 'Password',  label_ar: 'كلمة مرور' },
    ];
    return (
      <div className="flex flex-col gap-5">
        {/* Login method tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchUserTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                userTab === tab.key ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {lang === 'ar' ? tab.label_ar : tab.label_en}
            </button>
          ))}
        </div>
        {userTab === 'password' ? renderPasswordForm(true) : renderUserOtpForm()}
        <div className="text-center text-sm text-slate-500">
          {t("Don't have an account?", 'ليس لديك حساب؟')}{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            {t('Register', 'سجّل الآن')}
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Restaurant panel
  // ─────────────────────────────────────────────────────────────────────────
  function renderRestaurantPanel() {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3.5">
          <Building2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-orange-800">
              {t('Restaurant / Business Account', 'حساب مطعم أو منشأة تجارية')}
            </p>
            <p className="text-orange-600 mt-0.5 text-xs">
              {t('Sign in with the owner email linked to your restaurant on Tabaq.', 'سجّل الدخول بالبريد الإلكتروني للمالك المرتبط بمطعمك في طبق.')}
            </p>
          </div>
        </div>
        {renderPasswordForm(true)}
        <div className="text-center text-sm text-slate-500">
          {t('Want to list your restaurant?', 'تريد تسجيل مطعمك؟')}{' '}
          <Link href="/partners/register" className="text-primary font-semibold hover:underline">
            {t('Apply here', 'قدّم طلبك')}
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Admin panel
  // ─────────────────────────────────────────────────────────────────────────
  function renderAdminPanel() {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 bg-slate-800 rounded-xl p-3.5">
          <ShieldCheck className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-white">{t('Tabaq Admin Access', 'دخول مسؤولي طبق')}</p>
            <p className="text-slate-400 mt-0.5 text-xs">
              {t('Restricted to authorized administrators only.', 'مخصص للمسؤولين المعتمدين فقط.')}
            </p>
          </div>
        </div>
        {renderPasswordForm(false)}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Left branding panel content
  // ─────────────────────────────────────────────────────────────────────────
  const brandingContent = {
    user: {
      headline_en: 'Discover Saudi Arabia\'s finest dining',
      headline_ar: 'اكتشف أرقى تجارب الطعام في المملكة',
      sub_en: 'Book tables, earn rewards, follow critics — all in one place.',
      sub_ar: 'احجز طاولات، اكسب نقاطاً، وتابع نقّاد الطعام — كل شيء في مكان واحد.',
      stats: [
        { n: '500+', en: 'Restaurants', ar: 'مطعم' },
        { n: '50K+', en: 'Reviews', ar: 'تقييم' },
        { n: '10K+', en: 'Bookings', ar: 'حجز' },
      ],
    },
    restaurant: {
      headline_en: 'Grow your restaurant with Tabaq',
      headline_ar: 'طوّر مطعمك مع طبق',
      sub_en: 'Manage reservations, showcase your menu, and reach thousands of food lovers.',
      sub_ar: 'أدر الحجوزات، اعرض قائمتك، وتواصل مع آلاف المهتمين بالطعام.',
      stats: [
        { n: '49',   en: 'Partner restaurants', ar: 'مطعم شريك' },
        { n: '12',   en: 'Cities',              ar: 'مدينة' },
        { n: '10K+', en: 'Monthly bookings',    ar: 'حجز شهري' },
      ],
    },
    admin: {
      headline_en: 'Tabaq Platform Administration',
      headline_ar: 'إدارة منصة طبق',
      sub_en: 'Secure access to the platform control panel for authorized administrators.',
      sub_ar: 'وصول آمن إلى لوحة التحكم للمسؤولين المعتمدين.',
      stats: [
        { n: '49',   en: 'Restaurants', ar: 'مطعم' },
        { n: '9',    en: 'Users',       ar: 'مستخدم' },
        { n: '100%', en: 'Uptime',      ar: 'تشغيل مستمر' },
      ],
    },
  };
  const branding = brandingContent[mode];

  // ─────────────────────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Left / Top branding panel ──────────────────────────────────────── */}
      <div className={`hidden lg:flex lg:flex-col lg:justify-between lg:w-[44%] xl:w-[42%] p-10 xl:p-14 relative overflow-hidden
        ${mode === 'admin' ? 'bg-slate-900' : 'bg-gradient-to-br from-[#1a0a00] via-[#3d1000] to-[#e23744]'}`}>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #e23744 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff8c00 0%, transparent 50%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">ط</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Tabaq | طبق</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            {lang === 'ar' ? branding.headline_ar : branding.headline_en}
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            {lang === 'ar' ? branding.sub_ar : branding.sub_en}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {branding.stats.map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{s.n}</div>
                <div className="text-xs text-white/60 mt-1">{lang === 'ar' ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          {[
            { en: '🔒 Secure & encrypted', ar: '🔒 آمن ومشفّر' },
            { en: '🇸🇦 Made for Saudi Arabia', ar: '🇸🇦 صُنع للمملكة' },
          ].map((b, i) => (
            <span key={i} className="text-xs text-white/50 bg-white/10 rounded-full px-3 py-1">
              {lang === 'ar' ? b.ar : b.en}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors lg:hidden">
            <ArrowLeft className="w-4 h-4" />
            {t('Home', 'الرئيسية')}
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">ط</span>
            </div>
            <span className="font-bold text-slate-900">طبق</span>
          </div>
          <Link href="/" className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to home', 'العودة للرئيسية')}
          </Link>
          <span className="text-xs text-slate-400">{t("Saudi Arabia's #1 dining platform", 'منصة الطعام الأولى في المملكة')}</span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-8 text-center lg:text-start">
              <h2 className="text-2xl font-bold text-slate-900">
                {t('Welcome back', 'أهلاً بعودتك')}
              </h2>
              <p className="text-slate-500 mt-1.5 text-sm">
                {t('Sign in to your Tabaq account', 'سجّل الدخول إلى حسابك في طبق')}
              </p>
            </div>

            {/* Forgot password overlay */}
            {forgotOpen ? (
              <div className="flex flex-col gap-5">
                {renderForgot()}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Account type selector */}
                <AccountModeSelector mode={mode} onChange={switchMode} lang={lang} />

                {/* Form by mode */}
                {mode === 'user'       && renderUserPanel()}
                {mode === 'restaurant' && renderRestaurantPanel()}
                {mode === 'admin'      && renderAdminPanel()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            {t('By signing in you agree to the', 'بتسجيل الدخول فإنك توافق على')}{' '}
            <a href="/terms" className="text-primary hover:underline">{t('Terms of Service', 'شروط الخدمة')}</a>
            {' '}{t('and', 'و')}{' '}
            <a href="/privacy" className="text-primary hover:underline">{t('Privacy Policy', 'سياسة الخصوصية')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
