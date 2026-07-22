'use client';

import { useEffect, useState } from 'react';
import { Turnstile, SCRIPT_URL, DEFAULT_SCRIPT_ID } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import Script from 'next/script';

interface TurnstileWidgetProps {
  onVerify: (token: string | null) => void;
  onUnsupported?: () => void;
}

function getAppTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function TurnstileWidget({
  onVerify,
  onUnsupported,
  ref,
}: TurnstileWidgetProps & { ref?: React.Ref<TurnstileInstance> }) {
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
    const [theme, setTheme] = useState<'dark' | 'light'>(getAppTheme);

    useEffect(() => {
      const observer = new MutationObserver(() => {
        setTheme(getAppTheme());
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    }, []);

    if (!siteKey) {
      console.warn('Cloudflare Turnstile site key is missing in environment variables.');
      return null;
    }

    return (
      <div className="flex justify-center w-full my-2">
        <Script id={DEFAULT_SCRIPT_ID} src={SCRIPT_URL} strategy="afterInteractive" />
        <Turnstile
          ref={ref}
          siteKey={siteKey}
          injectScript={false}
          onSuccess={(token) => onVerify(token)}
          onExpire={() => onVerify(null)}
          onError={() => onVerify(null)}
          onTimeout={() => onVerify(null)}
          onUnsupported={() => {
            console.warn('Cloudflare Turnstile is not supported in this browser.');
            onVerify(null);
            onUnsupported?.();
          }}
          options={{
            action: 'turnstilespinv2',
            theme,
            size: 'normal',
            language: 'id',
            refreshExpired: 'auto',
            retry: 'auto',
            retryInterval: 5000,
          }}
        />
      </div>
    );
  }
