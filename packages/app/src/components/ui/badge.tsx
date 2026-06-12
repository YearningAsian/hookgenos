import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-900 text-brand-300 border border-brand-800',
        secondary: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        outline: 'border border-zinc-700 text-zinc-400',
        success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
        pro: 'bg-gradient-to-r from-brand-600 to-purple-600 text-white border-0',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
