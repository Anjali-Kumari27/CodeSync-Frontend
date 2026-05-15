import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  onClose: vi.fn(),
  onCreated: vi.fn(),
  toastError: vi.fn(),
  consoleError: vi.fn(),
}));

vi.mock('../api/services', () => ({
  projectApi: {
    create: mocks.create,
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: mocks.toastError,
  },
}));

import CreateProjectModal from '../components/CreateProjectModal';

function renderModal() {
  return render(<CreateProjectModal onClose={mocks.onClose} onCreated={mocks.onCreated} />);
}

describe('CreateProjectModal coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}) as any;
    mocks.create.mockResolvedValue({ data: { id: 1, name: 'Compiler' } });
  });

  it('closes from the cancel button and backdrop', () => {
    const { container } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mocks.onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.modal-backdrop') as HTMLElement);
    expect(mocks.onClose).toHaveBeenCalledTimes(2);
  });

  it('validates a short name without creating a project', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a project with edited fields, selected language, and public visibility', async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/my-awesome-project/i), { target: { value: 'Compiler' } });
    fireEvent.change(screen.getByPlaceholderText(/what is this project about/i), { target: { value: 'A parser playground' } });
    fireEvent.click(screen.getByRole('button', { name: /typescript/i }));
    fireEvent.click(screen.getByRole('button', { name: /public/i }));
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => expect(mocks.onCreated).toHaveBeenCalledWith({ id: 1, name: 'Compiler' }));
    expect(mocks.create).toHaveBeenCalledWith({
      name: 'Compiler',
      description: 'A parser playground',
      language: 'TYPESCRIPT',
      visibility: 'PUBLIC',
    });
  });

  it.each([
    [{ response: { status: 401, data: {} } }, 'Session expired. Please log in again.'],
    [{ response: { status: 403, data: {} } }, 'Session expired. Please log in again.'],
    [{ response: { status: 409, data: {} } }, 'A project with this name already exists'],
    [{}, 'Cannot reach server. Is the backend running?'],
    [{ response: { status: 500, data: { message: 'Name contains invalid symbols' } } }, 'Name contains invalid symbols'],
    [{ response: { status: 500, data: {} } }, 'Failed to create project'],
  ])('shows create failure message %#', async (error, message) => {
    mocks.create.mockRejectedValue(error);
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/my-awesome-project/i), { target: { value: 'Compiler' } });
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(message));
    expect(mocks.onCreated).not.toHaveBeenCalled();
    expect(mocks.consoleError).toHaveBeenCalled();
  });
});
