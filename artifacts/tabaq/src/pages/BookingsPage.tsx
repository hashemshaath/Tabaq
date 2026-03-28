import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useListBookings } from '@workspace/api-client-react';
import { CalendarDays, Clock, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; icon: React.ElementType; className: string }> = {
  confirmed: { labelEn: 'Confirmed', labelAr: 'مؤكد', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  pending: { labelEn: 'Pending', labelAr: 'معلق', icon: AlertCircle, className: 'text-yellow-600 bg-yellow-50' },
  cancelled: { labelEn: 'Cancelled', labelAr: 'ملغى', icon: XCircle, className: 'text-red-600 bg-red-50' },
  completed: { labelEn: 'Completed', labelAr: 'مكتمل', icon: CheckCircle2, className: 'text-blue-600 bg-blue-50' },
  no_show: { labelEn: 'No Show', labelAr: 'لم يحضر', icon: XCircle, className: 'text-gray-600 bg-gray-50' },
};

export function BookingsPage() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useListBookings({ limit: 20, offset: 0 });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('My Reservations', 'حجوزاتي')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your table reservations', 'إدارة حجوزات طاولتك')}</p>
          </div>
          <Link href="/restaurants">
            <Button>{t('Book a Table', 'احجز طاولة')}</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : !data?.bookings?.length ? (
          <div className="text-center py-20">
            <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('No reservations yet', 'لا توجد حجوزات بعد')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('Discover restaurants and make your first booking!', 'اكتشف المطاعم واحجز طاولتك الأولى!')}
            </p>
            <Link href="/restaurants">
              <Button>{t('Explore Restaurants', 'استكشف المطاعم')}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.bookings.map(booking => {
              const restaurantName = lang === 'ar' ? booking.restaurantNameAr : booking.restaurantNameEn;
              const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              return (
                <div key={booking.id} className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground">{restaurantName}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {lang === 'ar' ? status.labelAr : status.labelEn}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{booking.referenceCode}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      <span>{booking.partySize} {t('guests', 'أشخاص')}</span>
                    </div>
                  </div>

                  {booking.specialRequests && (
                    <p className="mt-4 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-4 py-2 italic">
                      &ldquo;{booking.specialRequests}&rdquo;
                    </p>
                  )}

                  {booking.status === 'pending' || booking.status === 'confirmed' ? (
                    <div className="mt-4 flex gap-3">
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                        {t('Cancel', 'إلغاء')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
