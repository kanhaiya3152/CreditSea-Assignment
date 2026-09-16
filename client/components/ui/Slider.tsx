'use client';

import { ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  className?: string;
}

export function Slider({ label, min, max, step, value, onChange, formatValue, className }: SliderProps): JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-section tabular-nums text-brand">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-brand"
        style={{
          background: `linear-gradient(to right, #1E4B4B ${percent}%, #E4E4E1 ${percent}%)`,
        }}
        aria-label={label}
      />
      <div className="flex justify-between text-caption text-muted tabular-nums">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
