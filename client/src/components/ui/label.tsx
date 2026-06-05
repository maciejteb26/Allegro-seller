import { forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    className={cn('text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    ref={ref}
    {...props}
  />
));
Label.displayName = 'Label';
