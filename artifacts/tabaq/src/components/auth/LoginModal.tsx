import React, { useState, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Phone, Mail, KeyRound, Loader2, ChevronRight } from "lucide-react";

type Step = "identifier" | "otp";
type AuthMode = "phone" | "email";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("identifier");
  const [authMode, setAuthMode] = useState<AuthMode>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (!open) return null;

  const isEmail = authMode === "email";

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const body = isEmail
        ? { email: identifier.trim() }
        : { phone: identifier.trim() };
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("Something went wrong", "حدث خطأ ما"));
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch {
      setError(t("Network error. Please try again.", "خطأ في الشبكة. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;
    setError(null);
    setLoading(true);
    try {
      const body = isEmail
        ? { email: identifier.trim(), code }
        : { phone: identifier.trim(), code };
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "otp_attempt_limit") {
          setError(t("Too many failed attempts. Please request a new code.", "محاولات فاشلة كثيرة. يرجى طلب رمز جديد."));
          handleBack();
        } else {
          setError(data.message || t("Invalid code", "رمز غير صحيح"));
        }
        return;
      }
      login(data.token, data.user);
      onClose();
    } catch {
      setError(t("Network error. Please try again.", "خطأ في الشبكة. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("identifier");
    setOtp(["", "", "", "", "", ""]);
    setDevCode(null);
    setError(null);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setIdentifier("");
    setError(null);
  };

  const identifierLabel = isEmail
    ? t("Email Address", "عنوان البريد الإلكتروني")
    : t("Phone Number", "رقم الهاتف");

  const identifierPlaceholder = isEmail
    ? t("you@example.com", "you@example.com")
    : t("+966 5X XXX XXXX", "+966 5X XXX XXXX");

  const sentTo = isEmail
    ? t(`Code sent to ${identifier}`, `تم إرسال الرمز إلى ${identifier}`)
    : t(`Code sent to ${identifier}`, `تم إرسال الرمز إلى ${identifier}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {step === "identifier" ? (
              isEmail ? <Mail className="w-8 h-8 text-primary" /> : <Phone className="w-8 h-8 text-primary" />
            ) : (
              <KeyRound className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {step === "identifier"
              ? t("Sign In to Tabaq", "تسجيل الدخول إلى طبق")
              : t("Enter Verification Code", "أدخل رمز التحقق")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === "identifier"
              ? t("Sign in or create an account to continue", "سجّل دخولك أو أنشئ حسابًا للمتابعة")
              : sentTo}
          </p>
        </div>

        {step === "identifier" ? (
          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            {/* Phone / Email toggle */}
            <div className="flex rounded-xl border border-border overflow-hidden mb-1">
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  authMode === "phone"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Phone className="w-4 h-4" />
                {t("Phone", "هاتف")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  authMode === "email"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Mail className="w-4 h-4" />
                {t("Email", "بريد")}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {identifierLabel}
              </label>
              <Input
                type={isEmail ? "email" : "tel"}
                placeholder={identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="rounded-xl text-base h-12"
                autoFocus
                dir="ltr"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold gap-2"
              disabled={loading || !identifier.trim()}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t("Send Code", "إرسال الرمز")}
                  <ChevronRight className={`w-5 h-5 ${lang === "ar" ? "rotate-180" : ""}`} />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {t(
                "By continuing, you agree to our Terms of Service.",
                "بالمتابعة، توافق على شروط الخدمة."
              )}
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {devCode && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {t("Dev mode — your OTP:", "وضع التطوير — رمزك:")}
                </p>
                <p className="text-2xl font-bold tracking-widest text-amber-700 dark:text-amber-400 mt-1">
                  {devCode}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2" dir="ltr" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-center">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={loading || otp.join("").length < 6}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("Verify & Sign In", "تحقق وتسجيل الدخول")
              )}
            </Button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {t("← Change contact", "← تغيير معلومات الاتصال")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
