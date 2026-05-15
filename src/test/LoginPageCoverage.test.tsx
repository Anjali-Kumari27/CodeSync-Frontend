import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setAuth: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
  decodeJwt: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  consoleError: vi.fn(),
  consoleWarn: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('../store', () => ({
  useAuthStore: () => ({ setAuth: mocks.setAuth }),
}));

vi.mock('../api/services', () => ({
  authApi: {
    login: mocks.login,
    me: mocks.me,
  },
}));

vi.mock('../api/client', () => ({
  decodeJwt: mocks.decodeJwt,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

import LoginPage from '../pages/LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

async function submitValidLogin() {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@test.dev' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('LoginPage coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}) as any;
    mocks.consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {}) as any;
    mocks.decodeJwt.mockReturnValue({
      sub: 7,
      username: 'ada',
      email: 'ada@test.dev',
      fullName: 'Ada Lovelace',
      roles: 'ROLE_USER',
    });
    mocks.login.mockResolvedValue({ data: { accessToken: 'access-token', refreshToken: 'refresh-token' } });
    mocks.me.mockResolvedValue({
      data: { id: 7, username: 'ada', email: 'ada@test.dev', fullName: 'Ada Lovelace', role: 'USER' },
    });
  });

  it('validates required and malformed fields without calling the API', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderLogin();
    const password = screen.getByLabelText(/password/i);

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(document.querySelector('.input-icon-btn') as HTMLElement);
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(document.querySelector('.input-icon-btn') as HTMLElement);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('logs in, stores tokens, fetches profile, updates auth store, and navigates', async () => {
    renderLogin();

    await submitValidLogin();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/dashboard'));
    expect(mocks.login).toHaveBeenCalledWith({ email: 'ada@test.dev', password: 'secret123' });
    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(mocks.me).toHaveBeenCalled();
    expect(mocks.setAuth).toHaveBeenCalledWith(
      { id: 7, username: 'ada', email: 'ada@test.dev', fullName: 'Ada Lovelace', role: 'USER' },
      'access-token',
      'refresh-token'
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('builds a fallback profile from JWT claims when profile fetch fails', async () => {
    mocks.me.mockRejectedValue({ response: { status: 503 } });
    renderLogin();

    await submitValidLogin();

    await waitFor(() => expect(mocks.setAuth).toHaveBeenCalled());
    expect(mocks.setAuth.mock.calls[0][0]).toMatchObject({
      id: 7,
      username: 'ada',
      email: 'ada@test.dev',
      fullName: 'Ada Lovelace',
      role: 'USER',
    });
    expect(mocks.consoleWarn).toHaveBeenCalled();
  });

  it('falls back to email-derived profile fields when JWT claims are sparse', async () => {
    mocks.decodeJwt.mockReturnValue({ id: 3 });
    mocks.me.mockRejectedValue(new Error('profile unavailable'));
    renderLogin();

    await submitValidLogin();

    await waitFor(() => expect(mocks.setAuth).toHaveBeenCalled());
    expect(mocks.setAuth.mock.calls[0][0]).toMatchObject({
      username: 'ada',
      email: 'ada@test.dev',
      role: 'USER',
    });
  });

  it('shows a server token error when login succeeds without access token', async () => {
    mocks.login.mockResolvedValue({ data: { accessToken: '', refreshToken: 'refresh-token' } });
    renderLogin();

    await submitValidLogin();

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('No token received from server'));
    expect(mocks.setAuth).not.toHaveBeenCalled();
  });

  it.each([
    [{ response: { status: 401 } }, 'Invalid email or password'],
    [{ response: { status: 403 } }, 'Invalid email or password'],
    [{ response: { status: 404 } }, 'Account not found. Please register first.'],
    [{}, 'Cannot connect to server. Is the backend running?'],
    [{ response: { status: 500, data: { message: 'Server says no' } } }, 'Server says no'],
    [{ response: { status: 500, data: { error: 'Server error text' } } }, 'Server error text'],
  ])('handles login failures %#', async (error, message) => {
    sessionStorage.setItem('accessToken', 'partial');
    sessionStorage.setItem('refreshToken', 'partial-refresh');
    mocks.login.mockRejectedValue(error);
    renderLogin();

    await submitValidLogin();

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(message));
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(mocks.consoleError).toHaveBeenCalled();
  });
});
