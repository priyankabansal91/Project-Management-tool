import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant class for destructive', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByText('Delete');
    expect(btn.className).toContain('destructive');
  });

  it('applies size class for icon', () => {
    render(<Button size="icon" aria-label="icon">X</Button>);
    const btn = screen.getByLabelText('icon');
    expect(btn.className).toContain('h-10 w-10');
  });
});
