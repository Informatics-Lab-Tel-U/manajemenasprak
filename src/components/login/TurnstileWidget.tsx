'use client';

import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string | null) => void;
}

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn('Cloudflare Turnstile site key is missing in environment variables.');
    return null;
  }

  return (
    <div className="flex justify-center w-full my-2">
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => onVerify(token)}
        onExpire={() => onVerify(null)}
        onError={() => onVerify(null)}
        options={{
          theme: 'light',
          size: 'normal',
        }}
      />
    </div>
  );
}
