import type { TextareaHTMLAttributes } from 'react';
import { cn } from './button';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-y rounded-2xl border border-cocoa-900/12 bg-white/70 px-4 py-3 text-sm leading-6 text-cocoa-950 outline-none transition-colors placeholder:text-cocoa-900/35 focus:border-ember-500 focus:ring-4 focus:ring-ember-500/15',
        className,
      )}
      {...props}
    />
  );
}
