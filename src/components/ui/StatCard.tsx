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

const colorClasses: Record<string, { icon: string; badge: string }> = {
  purple: { icon: 'text-chart-1 bg-chart-1/10', badge: 'bg-chart-1/10 text-chart-1' },
  blue: { icon: 'text-chart-2 bg-chart-2/10', badge: 'bg-chart-2/10 text-chart-2' },
  green: { icon: 'text-chart-4 bg-chart-4/10', badge: 'bg-chart-4/10 text-chart-4' },
  red: { icon: 'text-destructive bg-destructive/10', badge: 'bg-destructive/10 text-destructive' },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card className="bg-card backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
      <CardHeader className="flex items-start justify-between space-y-0 pb-3">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className={cn('rounded-lg p-2.5 shrink-0', colorClasses[color].icon)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && (
          <Badge
            variant="secondary"
            className={cn('text-xs font-medium', colorClasses[color].badge)}
          >
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
