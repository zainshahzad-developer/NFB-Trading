import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10'
}: StatCardProps) {
  return (
    <div className="stat-card bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-destructive',
              changeType === 'neutral' && 'text-muted-foreground'
            )}>
              {changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
              {changeType === 'negative' && <TrendingDown className="h-4 w-4" />}
              {change}
            </div>
          )}
        </div>
        <div className={cn('p-4 rounded-2xl', iconBg)}>
          <Icon className={cn('h-7 w-7', iconColor)} />
        </div>
      </div>
    </div>
  );
}