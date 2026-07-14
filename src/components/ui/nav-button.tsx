import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavButtonProps extends React.ComponentProps<typeof Button> {
  direction: 'prev' | 'next';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function NavButton({
  direction,
  loading = false,
  loadingText,
  icon,
  children,
  className,
  disabled,
  ...props
}: NavButtonProps) {
  const isPrev = direction === 'prev';
  const isNext = direction === 'next';

  return (
    <Button
      disabled={disabled || loading}
      className={cn('shrink-0 min-w-[140px]', className)}
      variant={props.variant || (isPrev ? 'outline' : 'default')}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText || (isNext ? 'Menyimpan...' : 'Loading...')}
        </>
      ) : (
        <>
          {isPrev && (icon || <ArrowLeft className="w-4 h-4 mr-2" />)}
          {children || (isPrev ? 'Sebelumnya' : 'Selanjutnya')}
          {isNext && (icon || <ArrowRight className="w-4 h-4 ml-2" />)}
        </>
      )}
    </Button>
  );
}
