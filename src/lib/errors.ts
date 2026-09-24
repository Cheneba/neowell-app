import { ApiError, NetworkError } from '@/api/client';

/** User-facing message for any error thrown by the API client. */
export function errorMessage(e: unknown, t: (key: string) => string): string {
  if (e instanceof NetworkError) return t('common.networkError');
  if (e instanceof ApiError && e.status === 429) return t('auth.tooManyRequests');
  return t('common.genericError');
}
