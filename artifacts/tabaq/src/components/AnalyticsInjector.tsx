import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

/* Injects GA4, GTM, and Meta Pixel scripts dynamically based on saved settings */
export function AnalyticsInjector() {
  const { settings } = useSettings();
  const { googleAnalyticsId, googleTagManagerId, metaPixelId } = settings.analytics;

  // Google Analytics 4
  useEffect(() => {
    if (!googleAnalyticsId) return;
    const existingScript = document.getElementById('ga4-script');
    if (existingScript) return;

    const script1 = document.createElement('script');
    script1.id = 'ga4-script';
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.id = 'ga4-init';
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleAnalyticsId}', { page_path: window.location.pathname });
    `;
    document.head.appendChild(script2);

    return () => {
      document.getElementById('ga4-script')?.remove();
      document.getElementById('ga4-init')?.remove();
    };
  }, [googleAnalyticsId]);

  // Google Tag Manager
  useEffect(() => {
    if (!googleTagManagerId) return;
    const existingScript = document.getElementById('gtm-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${googleTagManagerId}');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.id = 'gtm-noscript';
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);

    return () => {
      document.getElementById('gtm-script')?.remove();
      document.getElementById('gtm-noscript')?.remove();
    };
  }, [googleTagManagerId]);

  // Meta Pixel
  useEffect(() => {
    if (!metaPixelId) return;
    const existingScript = document.getElementById('meta-pixel-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'meta-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    return () => {
      document.getElementById('meta-pixel-script')?.remove();
    };
  }, [metaPixelId]);

  return null;
}
