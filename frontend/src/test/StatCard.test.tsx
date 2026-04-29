import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayoutDashboard, FolderKanban } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total Projects" value={42} icon={LayoutDashboard} />);
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard title="Tasks" value={10} subtitle="this month" icon={FolderKanban} />);
    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(<StatCard title="Tasks" value={10} icon={FolderKanban} />);
    expect(screen.queryByText('this month')).not.toBeInTheDocument();
  });

  it('renders positive trend with + sign', () => {
    render(
      <StatCard
        title="Tasks"
        value={10}
        icon={FolderKanban}
        trend={{ value: 12, label: 'vs last month' }}
      />
    );
    expect(screen.getByText('+12% vs last month')).toBeInTheDocument();
  });

  it('renders negative trend without + sign', () => {
    render(
      <StatCard
        title="Tasks"
        value={10}
        icon={FolderKanban}
        trend={{ value: -5, label: 'vs last month' }}
      />
    );
    expect(screen.getByText('-5% vs last month')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard title="Status" value="Active" icon={LayoutDashboard} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
