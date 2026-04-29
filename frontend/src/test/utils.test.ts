import { describe, it, expect } from 'vitest';
import { cn, getInitials, priorityColor, formatDate, timeAgo } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });
});

describe('getInitials', () => {
  it('returns first letters of each word uppercased', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('caps at 2 characters', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB');
  });

  it('handles single word', () => {
    expect(getInitials('Alice')).toBe('A');
  });
});

describe('priorityColor', () => {
  it('returns correct classes for known priorities', () => {
    expect(priorityColor('critical')).toContain('red');
    expect(priorityColor('high')).toContain('orange');
    expect(priorityColor('medium')).toContain('yellow');
    expect(priorityColor('low')).toContain('green');
  });

  it('falls back to none for unknown priority', () => {
    expect(priorityColor('unknown')).toBe(priorityColor('none'));
  });
});

describe('formatDate', () => {
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T00:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });
});

describe('timeAgo', () => {
  it('returns "just now" for very recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  it('returns minutes for dates within an hour', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
  });

  it('returns hours for dates within a day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days for older dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});
