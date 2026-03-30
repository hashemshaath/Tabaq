import React from 'react';
import { Link } from 'wouter';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/hooks/use-language';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice, currency } = useCart();
  const { t, lang } = useLanguage();

  const restaurantName = items[0]
    ? (lang === 'ar' ? items[0].restaurantNameAr : items[0].restaurantNameEn)
    : '';

  const deliveryFee = totalPrice >= 100 ? 0 : 15;
  const grandTotal = totalPrice + deliveryFee;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 end-0 h-full w-full sm:w-[420px] z-50 bg-background border-s border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
        style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">{t('Your Order', 'طلبك')}</h2>
              {restaurantName && (
                <p className="text-xs text-muted-foreground">{restaurantName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('Your cart is empty', 'سلتك فارغة')}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t('Browse restaurants and add dishes to your order', 'تصفح المطاعم وأضف الأطباق إلى طلبك')}
            </p>
            <Link href="/restaurants" onClick={onClose}>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
                {t('Explore Restaurants', 'استكشف المطاعم')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(item => (
                <div key={item.dishId} className="flex items-center gap-3 bg-accent/30 border border-border/50 rounded-xl p-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={lang === 'ar' ? item.nameAr : item.nameEn}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  )}
                  {!item.imageUrl && (
                    <div className="w-14 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {lang === 'ar' ? item.nameAr : item.nameEn}
                    </p>
                    <p className="text-primary font-bold text-sm mt-0.5">
                      {formatPrice(item.price * item.qty, item.currency, lang as 'en' | 'ar')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(item.dishId, item.qty - 1)}
                      className="w-7 h-7 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
                    >
                      {item.qty === 1 ? (
                        <Trash2 className="w-3 h-3 text-destructive" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </button>
                    <span className="text-sm font-bold tabular-nums w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.dishId, item.qty + 1)}
                      className="w-7 h-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear cart */}
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('Clear order', 'مسح الطلب')}
              </button>
            </div>

            {/* Summary & Checkout */}
            <div className="border-t border-border p-5 space-y-4 shrink-0 bg-background">
              {/* Fee breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('Subtotal', 'المجموع الفرعي')}</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(totalPrice, currency, lang as 'en' | 'ar')}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('Delivery fee', 'رسوم التوصيل')}</span>
                  {deliveryFee === 0 ? (
                    <span className="font-semibold text-emerald-600">{t('Free', 'مجاني')}</span>
                  ) : (
                    <span className="font-medium text-foreground">
                      {formatPrice(deliveryFee, currency, lang as 'en' | 'ar')}
                    </span>
                  )}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('Free delivery on orders over SAR 100', 'توصيل مجاني للطلبات فوق ١٠٠ ريال')}
                  </p>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1">
                  <span>{t('Total', 'الإجمالي')}</span>
                  <span className="text-primary">{formatPrice(grandTotal, currency, lang as 'en' | 'ar')}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link href="/checkout" onClick={onClose}>
                <button className="w-full flex items-center justify-between bg-primary text-primary-foreground font-bold px-5 py-3.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
                  <span>{t('Proceed to Checkout', 'المتابعة للدفع')}</span>
                  <div className="flex items-center gap-2">
                    <span>{formatPrice(grandTotal, currency, lang as 'en' | 'ar')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </Link>

              <button
                onClick={onClose}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {t('Continue browsing', 'متابعة التصفح')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
