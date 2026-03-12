import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
  color: 'purple' | 'blue' | 'green' | 'red';
  loading?: boolean;
}

const colorClasses: Record<string, { icon: string; badge: string; border: string; gradient: string }> = {
  purple: {
    icon: 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/20',
    badge:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    border: 'border-violet-200/50 dark:border-violet-500/20',
    gradient: 'from-violet-500 to-purple-500 bg-gradient-to-br',
  },
  blue: {
    icon: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20',
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    border: 'border-blue-200/50 dark:border-blue-500/20',
    gradient: 'from-blue-500 to-cyan-500 bg-gradient-to-br',
  },
  green: {
    icon: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    border: 'border-emerald-200/50 dark:border-emerald-500/20',
    gradient: 'from-emerald-500 to-green-500 bg-gradient-to-br',
  },
  red: {
    icon: 'text-destructive bg-destructive/10 dark:text-red-300 dark:bg-destructive/20',
    badge:
      'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-red-300 dark:border-red-500/20',
    border: 'border-destructive/20 dark:border-red-500/20',
    gradient: 'from-red-500 to-orange-500 bg-gradient-to-br',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  loading,
}: StatCardProps) {
  const style = colorClasses[color];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 group border bg-card hover:border-foreground/20 shadow-sm',
        style.border
      )}
    >
      <div
        className={cn(
          'absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-[0.15] dark:opacity-10 pointer-events-none transition-opacity group-hover:opacity-30',
          style.gradient
        )}
      />

      <CardHeader className="flex items-start justify-between space-y-0 pb-3 relative z-10">
        <div className="space-y-1 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-foreground/90 dark:text-foreground">
              {value}
            </h3>
          )}
        </div>
        <div className={cn('rounded-md p-2 shrink-0 shadow-sm', style.icon)}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground font-medium opacity-80">{subtitle}</p>
        {trend && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-bold tracking-wide border shadow-sm px-2 py-0.5',
              style.badge
            )}
          >
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
