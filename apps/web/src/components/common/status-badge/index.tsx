import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const STATUS_VARIANTS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  RUNNING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        STATUS_VARIANTS[status] ?? 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status}
    </Badge>
  );
}
