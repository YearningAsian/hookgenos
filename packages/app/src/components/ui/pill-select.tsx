'use client';
import { cn } from '@/lib/utils';

export interface PillOption {
  id: string;
  label: string;
  disabled?: boolean;
  suffix?: string;
}

export interface PillSelectProps {
  options: PillOption[];
  value: string;
  onChange?: (id: string) => void;
  size?: 'md' | 'sm';
  className?: string;
  'aria-label'?: string;
}

/**
 * PillSelect — a row of selectable pill buttons (single-select), used for
 * the platform / tone / count choosers in the generator (.hg-pill).
 */
export function PillSelect({ options, value, onChange, size = 'md', className, ...props }: PillSelectProps) {
  return (
    <div className={cn('hg-pills', className)} role="radiogroup" {...props}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          data-active={value === opt.id}
          disabled={opt.disabled}
          onClick={() => onChange?.(opt.id)}
          className={cn('hg-pill', size === 'sm' ? 'hg-pill--sm' : 'hg-pill--md')}
        >
          {opt.label}
          {opt.suffix && <span className="hg-pill__suffix">{opt.suffix}</span>}
        </button>
      ))}
    </div>
  );
}
