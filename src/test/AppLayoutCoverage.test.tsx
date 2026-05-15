import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  logout: vi.fn(),
  apiLogout: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('../store', () => ({
  useAuthStore: () => ({
    user: { username: 'ada', fullName: 'Ada Lovelace', email: 'ada@test.dev' },
    logout: mocks.logout,
  }),
}));

vi.mock('../api/services', () => ({
  authApi: {
    logout: mocks.apiLogout,
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mocks.toastSuccess,
  },
}));

import AppLayout from '../components/AppLayout';

function renderLayout(initialEntry = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppLayout>
        <div>Page body</div>
      </AppLayout>
    </MemoryRouter>
  );
}

describe('AppLayout coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.apiLogout.mockResolvedValue({});
  });

  it('renders hidden navigation mode with only children', () => {
    render(
      <MemoryRouter>
        <AppLayout hideNav>
          <div>Editor only</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Editor only')).toBeInTheDocument();
    expect(screen.queryByText('CodeSync')).not.toBeInTheDocument();
  });

  it('renders nav links, active state, and opens and closes the user menu', () => {
    const { container } = renderLayout('/projects');

    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(container.querySelector('#nav-projects')).toHaveClass('active');

    fireEvent.click(container.querySelector('#user-menu-btn') as HTMLElement);

    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();

    fireEvent.mouseLeave(container.querySelector('.user-menu-wrapper') as HTMLElement);
    expect(screen.queryByText('@ada')).not.toBeInTheDocument();
  });

  it('logs out with refresh token and navigates to login', async () => {
    sessionStorage.setItem('refreshToken', 'refresh-token');
    const { container } = renderLayout();

    fireEvent.click(container.querySelector('#user-menu-btn') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    expect(mocks.apiLogout).toHaveBeenCalledWith('refresh-token');
    expect(mocks.navigate).toHaveBeenCalledWith('/login');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Signed out successfully');
  });

  it('still logs out locally when the logout API fails and no refresh token exists', async () => {
    mocks.apiLogout.mockRejectedValue(new Error('network'));
    const { container } = renderLayout();

    fireEvent.click(container.querySelector('#user-menu-btn') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    expect(mocks.apiLogout).toHaveBeenCalledWith(undefined);
    expect(mocks.navigate).toHaveBeenCalledWith('/login');
  });
});
