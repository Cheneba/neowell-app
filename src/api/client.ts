import { Platform } from 'react-native';
import type {
  AppNotification,
  Baby,
  BookInput,
  CheckPlan,
  CheckResult,
  CheckSchedule,
  CheckType,
  Clinician,
  ClinicianInput,
  Complaint,
  Consultation,
  DrugChart,
  Earnings,
  Facility,
  FacilityHit,
  Growth,
  Me,
  Measurement,
  MeasurementInput,
  Medium,
  Message,
  MyClinicianProfile,
  NewBaby,
  Observation,
  ObservationInput,
  Referral,
  Summary,
  TokenPair,
  UploadFile,
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
type Body = { json: unknown } | { form: FormData } | undefined;

const q = (params: Record<string, string | number | boolean | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
};

export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetchImpl ?? fetch;
  let refreshing: Promise<boolean> | null = null;

  async function raw(method: Method, path: string, body: Body, token?: string) {
    try {
      return await doFetch(`${opts.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body && 'json' in body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? ('json' in body ? JSON.stringify(body.json) : body.form) : undefined,
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
      const res = await raw('POST', '/auth/refresh', { json: { refreshToken: current.refreshToken } });
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

  async function send<T>(method: Method, path: string, body?: Body, auth = true): Promise<T> {
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
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const request = <T>(method: Method, path: string, json?: unknown, auth = true) =>
    send<T>(method, path, json === undefined ? undefined : { json }, auth);

  /** Multipart upload; native uses `{ uri, name, type }`, web needs a real Blob. */
  async function upload<T>(path: string, file: UploadFile, fields: Record<string, string> = {}) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (Platform.OS === 'web') {
      const blob = await (await fetch(file.uri)).blob();
      form.append('file', new File([blob], file.name, { type: file.type }));
    } else {
      form.append('file', file as unknown as Blob);
    }
    return send<T>('POST', path, { form });
  }

  return {
    // ── Auth & account ──
    requestOtp: (phone: string) => request<{ expiresInSeconds: number }>('POST', '/auth/otp/request', { phone }, false),
    verifyOtp: (phone: string, code: string, role: 'CAREGIVER' | 'CLINICIAN') =>
      request<TokenPair>('POST', '/auth/otp/verify', { phone, code, role }, false),
    logout: (refreshToken: string) => request<void>('POST', '/auth/logout', { refreshToken }, false),
    me: () => request<Me>('GET', '/me'),
    updateMe: (data: Partial<Pick<Me, 'firstName' | 'lastName' | 'locale' | 'region' | 'city'>>) => request<Me>('PATCH', '/me', data),
    updateConsents: (data: { dataCollection?: boolean; clinicianShare?: boolean; recording?: boolean }) =>
      request<Me>('PUT', '/me/consents', data),
    exportData: () => request<unknown>('GET', '/me/export'),
    deleteAccount: () => request<{ purgeAfter: string }>('DELETE', '/me'),
    registerDevice: (expoPushToken: string, platform: string) => request<{ id: string }>('POST', '/me/devices', { expoPushToken, platform }),
    notifications: (cursor?: string) =>
      request<{ items: AppNotification[]; nextCursor: string | null; unreadCount: number }>('GET', `/me/notifications${q({ cursor })}`),
    markNotificationsRead: (body: { ids?: string[]; all?: boolean }) => request<void>('POST', '/me/notifications/read', body),

    // ── Babies & growth ──
    babies: () => request<Baby[]>('GET', '/babies'),
    baby: (id: string) => request<Baby>('GET', `/babies/${id}`),
    createBaby: (data: NewBaby) => request<Baby>('POST', '/babies', data),
    updateBaby: (id: string, data: Partial<NewBaby>) => request<Baby>('PATCH', `/babies/${id}`, data),
    deleteBaby: (id: string) => request<void>('DELETE', `/babies/${id}`),
    checkSchedule: (babyId: string) => request<CheckSchedule>('GET', `/babies/${babyId}/check-schedule`),
    measurements: (babyId: string) => request<Measurement[]>('GET', `/babies/${babyId}/measurements`),
    addMeasurement: (babyId: string, data: MeasurementInput) =>
      request<{ measurement: Measurement; growth: Growth }>('POST', `/babies/${babyId}/measurements`, data),
    growth: (babyId: string) => request<Growth>('GET', `/babies/${babyId}/growth`),

    // ── Checks ──
    checkPlan: (babyId: string, type: CheckType, complaints: Complaint[], lang: 'en' | 'fr') =>
      request<CheckPlan>('GET', `/babies/${babyId}/check-plan${q({ type, complaints: complaints.join(','), lang })}`),
    observations: (babyId: string, limit = 20) => request<Observation[]>('GET', `/babies/${babyId}/observations${q({ limit })}`),
    createObservation: (babyId: string, data: ObservationInput) => request<CheckResult>('POST', `/babies/${babyId}/observations`, data),
    uploadCheckPhoto: (babyId: string, observationId: string, file: UploadFile) =>
      upload<{ photoUrl: string }>(`/babies/${babyId}/observations/${observationId}/photo`, file),
    uploadVoiceNote: (babyId: string, file: UploadFile) => upload<{ id: string; status: string }>(`/babies/${babyId}/voice-notes`, file),
    summaryPdfPath: (babyId: string, days: 3 | 7, lang: 'en' | 'fr') => `/babies/${babyId}/summary.pdf${q({ days, lang })}`,

    // ── Facilities ──
    nearbyFacilities: (lat: number, lon: number, radiusKm = 100) =>
      request<Facility[]>('GET', `/facilities/nearby${q({ lat, lon, radiusKm })}`),
    searchFacilities: (text: string) => request<FacilityHit[]>('GET', `/facilities${q({ q: text, limit: 10 })}`),

    // ── Clinicians (public) ──
    clinicians: (filter: { medium?: Medium; availableNow?: boolean } = {}) =>
      request<Clinician[]>('GET', `/clinicians${q({ medium: filter.medium, availableNow: filter.availableNow ? 'true' : undefined })}`),
    clinician: (id: string) => request<Clinician>('GET', `/clinicians/${id}`),
    slots: (id: string, days = 7) => request<{ slots: string[] }>('GET', `/clinicians/${id}/slots${q({ days })}`),

    // ── Clinician (self) ──
    myClinician: () => request<MyClinicianProfile>('GET', '/clinicians/me'),
    registerClinician: (data: ClinicianInput) => request<MyClinicianProfile>('POST', '/clinicians/me', data),
    updateClinician: (data: Partial<ClinicianInput>) => request<MyClinicianProfile>('PATCH', '/clinicians/me', data),
    uploadClinicianPhoto: (file: UploadFile) => upload<{ photoUrl: string }>('/clinicians/me/photo', file),
    uploadClinicianDocument: (type: string, file: UploadFile) => upload<{ id: string }>('/clinicians/me/documents', file, { type }),
    setAvailability: (slots: { dayOfWeek: number; startMinute: number; endMinute: number }[]) =>
      request<unknown>('PUT', '/clinicians/me/availability', { slots }),
    setAvailableNow: (minutes: number) => request<{ availableNowUntil: string | null }>('PUT', '/clinicians/me/available-now', { minutes }),
    earnings: () => request<Earnings>('GET', '/clinicians/me/earnings'),

    // ── Consultations ──
    consultations: (scope?: 'active' | 'past') => request<Consultation[]>('GET', `/consultations${q({ scope })}`),
    consultation: (id: string) => request<Consultation>('GET', `/consultations/${id}`),
    book: (data: BookInput) => request<Consultation>('POST', '/consultations', data),
    pay: (id: string, provider: 'MTN_MOMO' | 'ORANGE_MONEY', payerPhone: string) =>
      request<{ paymentId: string; status: string }>('POST', `/consultations/${id}/payments`, { provider, payerPhone }),
    consultationAction: (id: string, action: 'accept' | 'decline' | 'start' | 'complete' | 'no-show' | 'cancel', body: object = {}) =>
      request<Consultation>('POST', `/consultations/${id}/${action}`, body),
    consultationSummary: (id: string) => request<Summary>('GET', `/consultations/${id}/summary`),
    messages: (id: string, after?: string) => request<Message[]>('GET', `/consultations/${id}/messages${q({ after, limit: 100 })}`),
    sendMessage: (id: string, body: string) => request<Message>('POST', `/consultations/${id}/messages`, { body }),
    sendImage: (id: string, file: UploadFile) => upload<Message>(`/consultations/${id}/messages/image`, file),
    markMessagesRead: (id: string, upToId: string) => request<void>('POST', `/consultations/${id}/messages/read`, { upToId }),
    callLink: (id: string) => request<{ joinUrl: string; expiresAt: string }>('POST', `/consultations/${id}/call`),
    refer: (id: string, data: { facilityId?: string; facilityName?: string; urgency: Referral['urgency']; reason: string }) =>
      request<Referral>('POST', `/consultations/${id}/referral`, data),
    prescribe: (id: string, items: { drugName: string; dose: string; route: string; timesOfDay: string[]; durationDays: number; instructions?: string }[]) =>
      request<DrugChart>('POST', `/consultations/${id}/drug-chart`, { items }),
    review: (id: string, rating: number, comment?: string) => request<unknown>('POST', `/consultations/${id}/review`, { rating, comment }),

    // ── Medicines ──
    drugCharts: (babyId: string) => request<DrugChart[]>('GET', `/babies/${babyId}/drug-charts`),
    logDose: (itemId: string, scheduledFor: string, status: 'GIVEN' | 'SKIPPED') =>
      request<unknown>('POST', `/drug-chart-items/${itemId}/doses`, { scheduledFor, status }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
