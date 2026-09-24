import type {
  Assessment,
  Baby,
  CheckSchedule,
  Facility,
  Me,
  Observation,
  ObservationInput,
  TokenPair,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Thrown when the server cannot be reached at all (offline, wrong URL). */
export class NetworkError extends Error {}

export interface TokenStore {
  get(): Promise<{ accessToken: string; refreshToken: string } | null>;
  set(tokens: { accessToken: string; refreshToken: string }): Promise<void>;
  clear(): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokens: TokenStore;
  /** Called when the session can no longer be refreshed, so the app can sign out. */
  onSessionExpired?: () => void;
  fetchImpl?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetchImpl ?? fetch;
  let refreshing: Promise<boolean> | null = null;

  async function raw(method: Method, path: string, body?: unknown, token?: string) {
    try {
      return await doFetch(`${opts.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new NetworkError('Network request failed');
    }
  }

  /** Exchanges the refresh token once; concurrent 401s share the same refresh. */
  function refresh(): Promise<boolean> {
    refreshing ??= (async () => {
      const current = await opts.tokens.get();
      if (!current) return false;
      const res = await raw('POST', '/auth/refresh', { refreshToken: current.refreshToken });
      if (!res.ok) {
        await opts.tokens.clear();
        opts.onSessionExpired?.();
        return false;
      }
      const pair = (await res.json()) as TokenPair;
      await opts.tokens.set({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
      return true;
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function request<T>(method: Method, path: string, body?: unknown, auth = true): Promise<T> {
    let token = auth ? (await opts.tokens.get())?.accessToken : undefined;
    let res = await raw(method, path, body, token);

    if (res.status === 401 && auth && (await refresh())) {
      token = (await opts.tokens.get())?.accessToken;
      res = await raw(method, path, body, token);
    }

    if (!res.ok) {
      let message = res.statusText;
      let code: string | undefined;
      try {
        const data = await res.json();
        message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? message);
        code = data.code;
      } catch {
        // non-JSON error body
      }
      throw new ApiError(res.status, message, code);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    requestOtp: (phone: string) =>
      request<{ expiresInSeconds: number }>('POST', '/auth/otp/request', { phone }, false),
    verifyOtp: (phone: string, code: string) =>
      request<TokenPair>('POST', '/auth/otp/verify', { phone, code, role: 'CAREGIVER' }, false),
    logout: (refreshToken: string) => request<void>('POST', '/auth/logout', { refreshToken }, false),

    me: () => request<Me>('GET', '/me'),
    updateMe: (data: Partial<Pick<Me, 'fullName' | 'locale'>>) => request<Me>('PATCH', '/me', data),
    updateConsents: (data: { dataCollection?: boolean; clinicianShare?: boolean; recording?: boolean }) =>
      request<Me>('PUT', '/me/consents', data),

    babies: () => request<Baby[]>('GET', '/babies'),
    baby: (id: string) => request<Baby>('GET', `/babies/${id}`),
    createBaby: (data: {
      name: string;
      dateOfBirth: string;
      sex?: string;
      birthWeightGrams?: number;
      gestationalAgeWeeks?: number;
    }) => request<Baby>('POST', '/babies', data),
    checkSchedule: (babyId: string) => request<CheckSchedule>('GET', `/babies/${babyId}/check-schedule`),

    observations: (babyId: string, limit = 20) =>
      request<Observation[]>('GET', `/babies/${babyId}/observations?limit=${limit}`),
    createObservation: (babyId: string, data: ObservationInput) =>
      request<{ observation: Observation; assessment: Assessment }>(
        'POST',
        `/babies/${babyId}/observations`,
        data,
      ),

    nearbyFacilities: (lat: number, lon: number, radiusKm = 50) =>
      request<Facility[]>('GET', `/facilities/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
