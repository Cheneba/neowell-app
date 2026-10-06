import { ApiError, createApiClient, NetworkError, type TokenStore } from '@/api/client';

function memoryTokens(initial: { accessToken: string; refreshToken: string } | null): TokenStore & {
  value: typeof initial;
} {
  const store = {
    value: initial,
    get: async () => store.value,
    set: async (t: NonNullable<typeof initial>) => {
      store.value = t;
    },
    clear: async () => {
      store.value = null;
    },
  };
  return store;
}

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, statusText: 'x', json: async () => body, text: async () => JSON.stringify(body) }) as Response;

describe('api client', () => {
  it('sends the bearer token', async () => {
    const fetchImpl = jest.fn(async () => json(200, []));
    const api = createApiClient({ baseUrl: 'http://api', tokens: memoryTokens({ accessToken: 'A', refreshToken: 'R' }), fetchImpl });
    await api.babies();
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api/babies',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer A' }) }),
    );
  });

  it('refreshes once on 401 and retries the request', async () => {
    const tokens = memoryTokens({ accessToken: 'old', refreshToken: 'R1' });
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(json(200, { accessToken: 'new', refreshToken: 'R2', isNewUser: false }))
      .mockResolvedValueOnce(json(200, [{ id: 'b1' }]));
    const api = createApiClient({ baseUrl: 'http://api', tokens, fetchImpl });

    await expect(api.babies()).resolves.toEqual([{ id: 'b1' }]);
    expect(tokens.value).toEqual({ accessToken: 'new', refreshToken: 'R2' });
    expect(fetchImpl.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });

  it('signs out when the refresh token is rejected', async () => {
    const tokens = memoryTokens({ accessToken: 'old', refreshToken: 'R1' });
    const onSessionExpired = jest.fn();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(401, {}));
    const api = createApiClient({ baseUrl: 'http://api', tokens, fetchImpl, onSessionExpired });

    await expect(api.babies()).rejects.toBeInstanceOf(ApiError);
    expect(tokens.value).toBeNull();
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('shares one refresh between concurrent requests', async () => {
    const tokens = memoryTokens({ accessToken: 'old', refreshToken: 'R1' });
    const fetchImpl = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'new', refreshToken: 'R2' });
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new' ? json(200, []) : json(401, {});
    });
    const api = createApiClient({ baseUrl: 'http://api', tokens, fetchImpl });

    await Promise.all([api.babies(), api.babies(), api.me()]);
    expect(fetchImpl.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('surfaces API error codes and messages', async () => {
    const fetchImpl = jest.fn(async () =>
      json(403, { code: 'CONSENT_REQUIRED', message: 'Consent needed' }),
    );
    const api = createApiClient({ baseUrl: 'http://api', tokens: memoryTokens(null), fetchImpl });
    await expect(api.createObservation('b', { temperatureC: 36.8 })).rejects.toMatchObject({
      status: 403,
      code: 'CONSENT_REQUIRED',
      message: 'Consent needed',
    });
  });

  it('turns fetch failures into NetworkError', async () => {
    const api = createApiClient({
      baseUrl: 'http://api',
      tokens: memoryTokens(null),
      fetchImpl: jest.fn(async () => {
        throw new TypeError('Network request failed');
      }),
    });
    await expect(api.requestOtp('+237670000000')).rejects.toBeInstanceOf(NetworkError);
  });
});
