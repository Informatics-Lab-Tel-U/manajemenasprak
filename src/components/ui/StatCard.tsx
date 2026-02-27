import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
  color: 'purple' | 'blue' | 'green' | 'red';
}

const colorClasses: Record<string, { icon: string; badge: string; border: string; gradient: string }> = {
  purple: { 
    icon: 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/20', 
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    border: 'border-violet-200/50 dark:border-violet-500/20',
    gradient: 'from-violet-500/20 to-purple-500/20'
  },
  blue: { 
    icon: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20', 
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    border: 'border-blue-200/50 dark:border-blue-500/20',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  green: { 
    icon: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20', 
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    border: 'border-emerald-200/50 dark:border-emerald-500/20',
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  red: { 
    icon: 'text-destructive bg-destructive/10 dark:text-red-300 dark:bg-destructive/20', 
    badge: 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-red-300 dark:border-red-500/20',
    border: 'border-destructive/20 dark:border-red-500/20',
    gradient: 'from-red-500/20 to-rose-500/20'
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  const style = colorClasses[color];

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border backdrop-blur-sm",
      "bg-white/60 dark:bg-zinc-900/60",
      style.border
    )}>
      {/* Dynamic Gradient Background Blob */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 bg-gradient-to-br transition-opacity group-hover:opacity-60 dark:group-hover:opacity-30",
        style.gradient
      )} />

      <CardHeader className="flex items-start justify-between space-y-0 pb-3 relative z-10">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors uppercase tracking-wider text-[10px]">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-foreground/90 dark:text-foreground">{value}</h3>
        </div>
        <div className={cn('rounded-lg p-2.5 shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300', style.icon)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 relative z-10">
        <p className="text-xs text-muted-foreground font-medium opacity-80">{subtitle}</p>
        {trend && (
          <Badge
            variant="outline"
            className={cn('text-[10px] font-bold tracking-wide border shadow-sm px-2 py-0.5', style.badge)}
          >
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
