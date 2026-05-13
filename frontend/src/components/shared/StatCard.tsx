import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <Card className={cn(
      'p-6 cursor-default transition-all duration-200',
      'hover:shadow-md hover:-translate-y-0.5',
      'group h-full flex flex-col justify-between',
      className
    )}>
      {/* top row: label + value | icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 transition-colors duration-200 group-hover:text-primary">{value}</p>
        </div>
        <div className={cn(
          'rounded-lg bg-primary/10 p-3 transition-all duration-200 flex-shrink-0',
          'group-hover:bg-primary/20 group-hover:scale-110',
          iconColor
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* bottom row: always present so every card has same structure */}
      <div className="mt-3 h-4 flex items-center">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </Card>
  );
}
