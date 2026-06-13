import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Interactive lift on hover. */
  hover?: boolean;
  /** Highlighted (Pro) treatment — purple border + tinted fill. */
  brand?: boolean;
  /** Apply the standard internal padding. */
  pad?: boolean;
}

/**
 * Card — translucent glass surface over the dark canvas (.hg-card).
 * The base container for features, panels, and highlighted tiers.
 */
export function Card({ hover = false, brand = false, pad = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn('hg-card', hover && 'hg-card--hover', brand && 'hg-card--brand', pad && 'hg-card--pad', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('hg-card__title', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('hg-card__desc', className)} {...props} />;
}
