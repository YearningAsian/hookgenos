import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Badge — small status pill. `pro` carries the drifting brand gradient. */
const badgeVariants = cva('hg-badge', {
  variants: {
    variant: {
      default: 'hg-badge--default',
      secondary: 'hg-badge--secondary',
      outline: 'hg-badge--outline',
      success: 'hg-badge--success',
      danger: 'hg-badge--danger',
      pro: 'hg-badge--pro',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
