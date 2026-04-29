import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectModal } from '@/components/shared/ProjectModal';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectModal', () => {
  it('renders when open', () => {
    render(<ProjectModal {...defaultProps} />);
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProjectModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('shows edit title when project prop is provided', () => {
    render(
      <ProjectModal
        {...defaultProps}
        project={{ id: '1', name: 'Test', key: 'TST', visibility: 'private', color: '#3B82F6' }}
      />
    );
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<ProjectModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('validates required fields on submit', async () => {
    render(<ProjectModal {...defaultProps} />);
    await userEvent.click(screen.getByText('Create Project'));
    expect(screen.getByText('Project name is required')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('validates key length', async () => {
    render(<ProjectModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('e.g., Customer Portal Redesign');
    const keyInput = screen.getByPlaceholderText('e.g., CPR');
    await userEvent.type(nameInput, 'My Project');
    await userEvent.type(keyInput, 'A');
    await userEvent.click(screen.getByText('Create Project'));
    expect(screen.getByText('Key must be 2-10 characters')).toBeInTheDocument();
  });

  it('calls onSave with uppercased key on valid submit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProjectModal {...defaultProps} onSave={onSave} />);
    await userEvent.type(screen.getByPlaceholderText('e.g., Customer Portal Redesign'), 'My Project');
    await userEvent.type(screen.getByPlaceholderText('e.g., CPR'), 'MP');
    await userEvent.click(screen.getByText('Create Project'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Project', key: 'MP' }));
    });
  });

  it('displays external error prop', () => {
    render(<ProjectModal {...defaultProps} error="Project key already in use" />);
    expect(screen.getByText('Project key already in use')).toBeInTheDocument();
  });

  it('shows saving state on button', () => {
    render(<ProjectModal {...defaultProps} saving={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders workflow select when workflows provided', () => {
    const workflows = [{ id: 'wf-1', name: 'Scrum', stages: [] }];
    render(<ProjectModal {...defaultProps} workflows={workflows as any} />);
    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByText('Scrum')).toBeInTheDocument();
  });
});
