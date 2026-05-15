import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosState = vi.hoisted(() => {
  const api = vi.fn((config) => Promise.resolve({ data: 'retried', config })) as any;
  api.defaults = { headers: { common: {} } };
  api.interceptors = {
    request: { use: vi.fn((success, failure) => {
      axiosState.requestSuccess = success;
      axiosState.requestFailure = failure;
    }) },
    response: { use: vi.fn((success, failure) => {
      axiosState.responseSuccess = success;
      axiosState.responseFailure = failure;
    }) },
  };

  return {
    api,
    post: vi.fn(),
    requestSuccess: undefined as any,
    requestFailure: undefined as any,
    responseSuccess: undefined as any,
    responseFailure: undefined as any,
  };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosState.api),
    post: axiosState.post,
  },
}));

function jwt(payload: Record<string, unknown>) {
  return `header.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.sig`;
}

describe('api client', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    sessionStorage.clear();
    axiosState.api.defaults.headers.common = {};
    axiosState.api.mockClear();
    axiosState.post.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost/' },
    });
    await import('../api/client');
  });

  it('decodes valid JWT payloads and returns null for malformed tokens', async () => {
    const { decodeJwt } = await import('../api/client');

    expect(decodeJwt(jwt({ sub: 12, username: 'ada' }))).toMatchObject({ sub: 12, username: 'ada' });
    expect(decodeJwt('not-a-token')).toBeNull();
    expect(decodeJwt('a.broken-json.c')).toBeNull();
  });

  it('adds authorization and user id headers when an access token is present', () => {
    sessionStorage.setItem('accessToken', jwt({ sub: 99 }));

    const config = axiosState.requestSuccess({ headers: {} });

    expect(config.headers.Authorization).toMatch(/^Bearer /);
    expect(config.headers['X-User-Id']).toBe('99');
  });

  it('leaves request headers unchanged when no token exists and rejects request errors', async () => {
    const config = axiosState.requestSuccess({ headers: { Existing: 'yes' } });

    expect(config.headers).toEqual({ Existing: 'yes' });
    await expect(axiosState.requestFailure(new Error('request failed'))).rejects.toThrow('request failed');
  });

  it('passes successful responses through unchanged', () => {
    const response = { data: { ok: true } };

    expect(axiosState.responseSuccess(response)).toBe(response);
  });

  it('refreshes tokens on non-auth 401 responses and retries the original request', async () => {
    axiosState.post.mockResolvedValue({
      data: { accessToken: jwt({ sub: 3 }), refreshToken: 'new-refresh' },
    });
    sessionStorage.setItem('refreshToken', 'old-refresh');
    const original = { url: '/api/projects/my', headers: {} };

    await expect(axiosState.responseFailure({ config: original, response: { status: 401 } })).resolves.toMatchObject({
      data: 'retried',
    });

    expect(axiosState.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/refresh',
      { refreshToken: 'old-refresh' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    expect(sessionStorage.getItem('accessToken')).toMatch(/^header\./);
    expect(sessionStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(original.headers.Authorization).toMatch(/^Bearer /);
    expect(axiosState.api).toHaveBeenCalledWith(original);
  });

  it('queues requests while refresh is already in progress', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosState.post.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));
    sessionStorage.setItem('refreshToken', 'refresh-token');

    const first = axiosState.responseFailure({ config: { url: '/api/projects/1', headers: {} }, response: { status: 401 } });
    const queuedOriginal = { url: '/api/projects/2', headers: {} };
    const second = axiosState.responseFailure({ config: queuedOriginal, response: { status: 401 } });

    resolveRefresh({ data: { accessToken: jwt({ sub: 4 }) } });

    await expect(first).resolves.toMatchObject({ data: 'retried' });
    await expect(second).resolves.toMatchObject({ data: 'retried' });
    expect(axiosState.post).toHaveBeenCalledTimes(1);
    expect(queuedOriginal.headers.Authorization).toMatch(/^Bearer /);
  });

  it('clears tokens and redirects when refresh token is missing or refresh fails', async () => {
    sessionStorage.setItem('accessToken', 'expired');

    await expect(
      axiosState.responseFailure({ config: { url: '/api/projects/my', headers: {} }, response: { status: 401 } })
    ).rejects.toBeTruthy();

    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(window.location.href).toBe('/login');

    sessionStorage.setItem('accessToken', 'expired');
    sessionStorage.setItem('refreshToken', 'refresh-token');
    axiosState.post.mockRejectedValue(new Error('refresh failed'));

    await expect(
      axiosState.responseFailure({ config: { url: '/api/projects/my', headers: {} }, response: { status: 401 } })
    ).rejects.toThrow('refresh failed');

    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('does not refresh auth endpoint, retried, or non-401 failures', async () => {
    const authError = { config: { url: '/api/auth/login', headers: {} }, response: { status: 401 } };
    const retriedError = { config: { url: '/api/projects/my', headers: {}, _retry: true }, response: { status: 401 } };
    const serverError = { config: { url: '/api/projects/my', headers: {} }, response: { status: 500 } };

    await expect(axiosState.responseFailure(authError)).rejects.toBe(authError);
    await expect(axiosState.responseFailure(retriedError)).rejects.toBe(retriedError);
    await expect(axiosState.responseFailure(serverError)).rejects.toBe(serverError);
    expect(axiosState.post).not.toHaveBeenCalled();
  });
});
