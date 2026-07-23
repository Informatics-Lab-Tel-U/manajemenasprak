'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      // router.refresh() will re-fetch the current server component
      // and apply the DOM updates in place without a hard reload.
      router.refresh();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [router, intervalMs]);

  // This component doesn't render anything visible
  return null;
}
