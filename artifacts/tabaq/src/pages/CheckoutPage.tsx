import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/hooks/use-language';
import { usePageMeta } from '@/hooks/use-page-meta';
import { formatPrice } from '@/lib/utils';
import {
  ChevronLeft, MapPin, Clock, CreditCard, CheckCircle2, ShoppingBag,
  Utensils, Package, Phone, User, ChevronRight, Loader2, Star,
} from 'lucide-react';

type OrderMode = 'dine_in' | 'pickup' | 'delivery';
type PaymentMethod = 'card' | 'apple_pay' | 'stc_pay' | 'cash';
type CheckoutStep = 'details' | 'payment' | 'confirmed';

const PAYMENT_METHODS: { id: PaymentMethod; labelEn: string; labelAr: string; icon: string; available: boolean }[] = [
  { id: 'card', labelEn: 'Credit / Debit Card', labelAr: 'بطاقة ائتمان / خصم', icon: '💳', available: true },
  { id: 'apple_pay', labelEn: 'Apple Pay', labelAr: 'Apple Pay', icon: '🍎', available: true },
  { id: 'stc_pay', labelEn: 'STC Pay', labelAr: 'STC Pay', icon: '📱', available: true },
  { id: 'cash', labelEn: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام', icon: '💵', available: true },
];

function OrderConfirmed({ items, total, currency, lang, t, onDone }: {
  items: any[]; total: number; currency: string; lang: string;
  t: (en: string, ar: string) => string; onDone: () => void;
}) {
  const orderNum = `TBQ-${Math.floor(Math.random() * 900000 + 100000)}`;
  const eta = `${Math.floor(Math.random() * 10 + 25)}–${Math.floor(Math.random() * 10 + 35)} ${t('min', 'د')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="relative mx-auto w-28 h-28 mb-6">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
          <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl">
            <CheckCircle2 className="w-14 h-14 text-white stroke-[1.5]" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">{t('Order Placed!', 'تم الطلب!')}</h1>
        <p className="text-gray-500 mb-8">{t('Your order has been confirmed and is being prepared.', 'تم تأكيد طلبك وهو قيد التحضير.')}</p>

        {/* Order card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 text-start">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('Order Number', 'رقم الطلب')}</p>
              <p className="font-black text-gray-900 text-lg">{orderNum}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t('ETA', 'الوقت المتوقع')}</p>
              <p className="font-bold text-primary">{eta}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {items.slice(0, 3).map(item => (
              <div key={item.dishId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {item.qty}× {lang === 'ar' ? item.nameAr : item.nameEn}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(item.price * item.qty, item.currency, lang as 'en' | 'ar')}
                </span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-gray-400">+{items.length - 3} {t('more items', 'عناصر إضافية')}</p>
            )}
          </div>

          <div className="flex items-center justify-between font-bold border-t border-gray-100 pt-3">
            <span className="text-gray-900">{t('Total Paid', 'المبلغ المدفوع')}</span>
            <span className="text-primary text-lg">{formatPrice(total, currency, lang as 'en' | 'ar')}</span>
          </div>
        </div>

        {/* Track order */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-start">
            <p className="font-semibold text-gray-900 text-sm">{t('Preparing your order', 'جارٍ تحضير طلبك')}</p>
            <p className="text-gray-500 text-xs">{t('Estimated delivery time', 'الوقت التقديري للتسليم')}: {eta}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/restaurants" className="flex-1">
            <button onClick={onDone} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl text-sm transition-colors">
              {t('Order Again', 'طلب مجدداً')}
            </button>
          </Link>
          <Link href="/bookings" className="flex-1">
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              {t('Track Order', 'تتبع الطلب')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { items, totalPrice, currency, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [orderMode, setOrderMode] = useState<OrderMode>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [placing, setPlacing] = useState(false);

  usePageMeta({
    titleEn: 'Checkout — Tabaq',
    titleAr: 'الدفع — طبق',
    descriptionEn: 'Complete your food order on Tabaq.',
    descriptionAr: 'أكمل طلبك على طبق.',
  }, lang);

  const deliveryFee = orderMode === 'delivery' ? (totalPrice >= 100 ? 0 : 15) : 0;
  const grandTotal = totalPrice + deliveryFee;
  const restaurantName = items[0]
    ? (lang === 'ar' ? items[0].restaurantNameAr : items[0].restaurantNameEn)
    : '';

  const handlePlaceOrder = async () => {
    setPlacing(true);
    await new Promise(r => setTimeout(r, 1800));
    setPlacing(false);
    setStep('confirmed');
    clearCart();
  };

  if (step === 'confirmed') {
    return (
      <OrderConfirmed
        items={items}
        total={grandTotal}
        currency={currency}
        lang={lang}
        t={t}
        onDone={() => navigate('/restaurants')}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Your cart is empty', 'سلتك فارغة')}</h2>
          <p className="text-gray-500 mb-6">{t('Add some dishes from a restaurant first.', 'أضف بعض الأطباق من مطعم أولاً.')}</p>
          <Link href="/restaurants">
            <button className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors text-sm">
              {t('Browse Restaurants', 'تصفح المطاعم')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/restaurants" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">{t('Checkout', 'إتمام الطلب')}</h1>
          {restaurantName && (
            <span className="text-gray-400 text-sm ms-auto">{restaurantName}</span>
          )}
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {[
              { id: 'details', labelEn: 'Details', labelAr: 'التفاصيل', num: 1 },
              { id: 'payment', labelEn: 'Payment', labelAr: 'الدفع', num: 2 },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => s.id === 'payment' && step === 'payment' ? setStep('payment') : step === 'payment' ? setStep('details') : null}
                className={`flex items-center gap-2 px-4 py-3.5 border-b-2 text-sm font-semibold transition-colors ${
                  step === s.id ? 'border-primary text-primary' : step === 'payment' && s.id === 'details' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.id ? 'bg-primary text-white' : step === 'payment' && s.id === 'details' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step === 'payment' && s.id === 'details' ? '✓' : s.num}
                </div>
                {lang === 'ar' ? s.labelAr : s.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-5">

            {step === 'details' && (
              <>
                {/* Order mode */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">{t('How would you like your order?', 'كيف تريد استلام طلبك؟')}</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'delivery' as OrderMode, labelEn: 'Delivery', labelAr: 'توصيل', icon: Package, eta: '30–45 min' },
                      { id: 'pickup' as OrderMode, labelEn: 'Pickup', labelAr: 'استلام', icon: Utensils, eta: '15–20 min' },
                      { id: 'dine_in' as OrderMode, labelEn: 'Dine In', labelAr: 'بالمطعم', icon: User, eta: 'Now' },
                    ].map(opt => {
                      const Icon = opt.icon;
                      const active = orderMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setOrderMode(opt.id)}
                          className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                            active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold text-sm">{lang === 'ar' ? opt.labelAr : opt.labelEn}</span>
                          <span className={`text-xs ${active ? 'text-primary/70' : 'text-gray-400'}`}>{opt.eta}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">{t('Contact Information', 'معلومات التواصل')}</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {t('Full Name', 'الاسم الكامل')}
                      </label>
                      <div className="relative">
                        <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder={t('Your full name', 'اسمك الكامل')}
                          className="w-full ps-9 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {t('Phone Number', 'رقم الجوال')}
                      </label>
                      <div className="relative">
                        <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+966 5xx xxx xxxx"
                          className="w-full ps-9 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    {orderMode === 'delivery' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          {t('Delivery Address', 'عنوان التوصيل')}
                        </label>
                        <div className="relative">
                          <MapPin className="absolute start-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            rows={2}
                            placeholder={t('Street, district, city', 'الشارع، الحي، المدينة')}
                            className="w-full ps-9 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {t('Special Instructions (optional)', 'تعليمات خاصة (اختياري)')}
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder={t('Allergies, spice preference, etc.', 'حساسية، تفضيل التوابل، إلخ')}
                        className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  disabled={!name.trim() || !phone.trim() || (orderMode === 'delivery' && !address.trim())}
                  className="w-full flex items-center justify-between bg-primary text-white font-bold px-5 py-3.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{t('Continue to Payment', 'المتابعة للدفع')}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 'payment' && (
              <>
                {/* Payment method */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">{t('Payment Method', 'طريقة الدفع')}</h2>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-start ${
                          paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${paymentMethod === method.id ? 'bg-primary/10' : 'bg-gray-50'}`}>
                          {method.icon}
                        </div>
                        <span className={`font-semibold text-sm ${paymentMethod === method.id ? 'text-primary' : 'text-gray-700'}`}>
                          {lang === 'ar' ? method.labelAr : method.labelEn}
                        </span>
                        <div className={`ms-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card fields */}
                {paymentMethod === 'card' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-bold text-gray-900 mb-4">{t('Card Details', 'بيانات البطاقة')}</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          {t('Card Number', 'رقم البطاقة')}
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full ps-9 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-gray-400 tracking-widest font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            {t('Expiry', 'الانتهاء')}
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-gray-400 font-mono tracking-widest"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">CVV</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-gray-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                      🔒 {t('Your payment is secured with 256-bit SSL encryption', 'مدفوعاتك محمية بتشفير SSL 256 بت')}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-4 rounded-xl hover:bg-primary/90 disabled:opacity-70 transition-colors text-base"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('Placing order...', 'جارٍ تقديم الطلب...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t('Place Order', 'تقديم الطلب')} · {formatPrice(grandTotal, currency, lang as 'en' | 'ar')}
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400">
                  {t(
                    'By placing your order you agree to our Terms of Service and Privacy Policy.',
                    'بتقديم طلبك توافق على شروط الخدمة وسياسة الخصوصية.'
                  )}
                </p>
              </>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">{t('Order Summary', 'ملخص الطلب')}</h2>
                <span className="text-xs text-gray-400">{items.length} {t('items', 'عناصر')}</span>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.dishId} className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.qty}× {lang === 'ar' ? item.nameAr : item.nameEn}
                      </p>
                      <p className="text-xs text-gray-400">{lang === 'ar' ? item.restaurantNameAr : item.restaurantNameEn}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {formatPrice(item.price * item.qty, item.currency, lang as 'en' | 'ar')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fee breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{t('Subtotal', 'المجموع الفرعي')}</span>
                  <span>{formatPrice(totalPrice, currency, lang as 'en' | 'ar')}</span>
                </div>
                {orderMode === 'delivery' && (
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Delivery', 'التوصيل')}</span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-semibold">{t('Free', 'مجاني')}</span>
                    ) : (
                      <span>{formatPrice(deliveryFee, currency, lang as 'en' | 'ar')}</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                  <span>{t('Total', 'الإجمالي')}</span>
                  <span className="text-primary">{formatPrice(grandTotal, currency, lang as 'en' | 'ar')}</span>
                </div>
              </div>

              {/* Trust signals */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {[
                  { icon: '✅', en: 'Secure checkout', ar: 'دفع آمن' },
                  { icon: '🔁', en: 'Easy cancellation', ar: 'إلغاء سهل' },
                  { icon: '⭐', en: '4.8★ rated service', ar: 'خدمة مُقيَّمة بـ ٤.٨' },
                ].map(s => (
                  <div key={s.en} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{s.icon}</span>
                    <span>{lang === 'ar' ? s.ar : s.en}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
