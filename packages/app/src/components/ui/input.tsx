import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual size — `lg` matches the hero/composer field. */
  inputSize?: 'md' | 'lg';
}

/** Input — text field that snaps to a purple focus ring (.hg-input). */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, inputSize = 'md', ...props }, ref) => (
  <input
    type={type}
    className={cn('hg-input', inputSize === 'lg' && 'hg-input--lg', className)}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
