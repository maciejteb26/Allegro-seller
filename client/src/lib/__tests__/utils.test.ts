import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
  });

  it('lets later tailwind classes override earlier conflicting ones', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('px-2', false, undefined, null, 'py-2')).toBe('px-2 py-2');
  });
});
