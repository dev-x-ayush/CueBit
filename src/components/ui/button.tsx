import type { ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const variants = {
    primary:
      'bg-ember-500 text-cocoa-950 shadow-[0_10px_24px_-8px_rgb(255_107_53/0.7)] hover:bg-ember-400 hover:-translate-y-px active:translate-y-0 focus-visible:ring-ember-500/60',
    secondary:
      'border border-cocoa-900/12 bg-white/60 text-cocoa-900 hover:border-cocoa-900/25 hover:bg-white focus-visible:ring-ember-500/50',
    ghost: 'bg-transparent text-cocoa-900/60 hover:bg-cocoa-900/[0.06] hover:text-cocoa-950 focus-visible:ring-ember-500/50',
    danger: 'bg-transparent text-cocoa-900/45 hover:bg-rose-500/10 hover:text-rose-600 focus-visible:ring-rose-500',
  };
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'min-h-9 px-3.5 text-xs' : 'min-h-11 px-5 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
