import React, { useState, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Phone, KeyRound, Loader2, ChevronRight } from "lucide-react";

type Step = "phone" | "otp";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (!open) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("Invalid code", "رمز غير صحيح"));
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
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setDevCode(null);
    setError(null);
  };

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

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {step === "phone" ? (
              <Phone className="w-8 h-8 text-primary" />
            ) : (
              <KeyRound className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {step === "phone"
              ? t("Sign In to Tabaq", "تسجيل الدخول إلى طبق")
              : t("Enter Verification Code", "أدخل رمز التحقق")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === "phone"
              ? t("Enter your phone number to continue", "أدخل رقم هاتفك للمتابعة")
              : t(`Code sent to ${phone}`, `تم إرسال الرمز إلى ${phone}`)}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t("Phone Number", "رقم الهاتف")}
              </label>
              <Input
                type="tel"
                placeholder={t("+966 5X XXX XXXX", "٩٦٦+ 5X XXX XXXX")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              disabled={loading || !phone.trim()}
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
              {t("← Change phone number", "← تغيير رقم الهاتف")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
