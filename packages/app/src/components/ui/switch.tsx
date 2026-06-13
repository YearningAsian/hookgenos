'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

/** Switch — on/off toggle with a spring-loaded thumb (.hg-switch). */
export function Switch({ checked = false, onChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-on={checked}
      onClick={() => onChange?.(!checked)}
      className={cn('hg-switch', className)}
      {...props}
    >
      <span className="hg-switch__thumb" />
    </button>
  );
}
