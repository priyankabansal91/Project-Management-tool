import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizeMap[size], className)} />;
  }

  return (
    <div className={cn('rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium', sizeMap[size], className)}>
      {getInitials(name)}
    </div>
  );
}
