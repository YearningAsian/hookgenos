import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — the Kinetic action primitive. Styling lives in globals.css
 * (.hg-btn) so real :hover / :active / :focus-visible / glow states ship
 * with the component. `cta` carries the breathing purple glow used on the
 * primary conversion path.
 */
const buttonVariants = cva('hg-btn', {
  variants: {
    variant: {
      default: 'hg-btn--default',
      cta: 'hg-btn--cta',
      outline: 'hg-btn--outline',
      ghost: 'hg-btn--ghost',
      secondary: 'hg-btn--secondary',
      destructive: 'hg-btn--destructive',
      link: 'hg-btn--link',
    },
    size: {
      default: 'hg-btn--md',
      sm: 'hg-btn--sm',
      lg: 'hg-btn--lg',
      icon: 'hg-btn--icon',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
