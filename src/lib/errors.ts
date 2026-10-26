import { ApiError, NetworkError } from '@/api/client';

/** User-facing message for any error thrown by the API client. */
export function errorMessage(e: unknown, t: (key: string) => string): string {
  if (e instanceof NetworkError) return t('common.networkError');
  if (e instanceof ApiError && e.status === 429) return t('auth.tooManyRequests');
  if (e instanceof ApiError && e.code === 'CLINICIAN_SUSPENDED') return t('blocked.signInSuspended');
  if (e instanceof ApiError && e.code === 'CLINICIAN_NOT_VERIFIED') return t('blocked.signInUnverified');
  return t('common.genericError');
}
