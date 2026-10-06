import type { ConsultationStatus } from '@/api/types';

export type Tone = 'info' | 'warning' | 'danger' | 'success' | 'pink';

export const STATUS_TONE: Record<ConsultationStatus, Tone> = {
  AWAITING_PAYMENT: 'warning',
  REQUESTED: 'pink',
  CONFIRMED: 'info',
  IN_PROGRESS: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  DECLINED: 'danger',
  EXPIRED: 'danger',
  NO_SHOW: 'danger',
};

export const MEDIUM_ICON = { CHAT: 'chatbubbles', AUDIO: 'call', VIDEO: 'videocam' } as const;

/** Lowest fee across the media a clinician offers. */
export function lowestFee(media: Partial<Record<string, number>>): number | null {
  const fees = Object.values(media).filter((n): n is number => typeof n === 'number');
  return fees.length ? Math.min(...fees) : null;
}

/** Mirrors the API rule (FR-CONS-10): refunded while waiting for the doctor, or at least 1 hour before the start. */
export function refundOnCancel(c: { status: ConsultationStatus; scheduledAt: string; paymentStatus: string }, now = new Date()) {
  if (c.paymentStatus !== 'PAID') return false;
  if (c.status === 'REQUESTED') return true;
  return new Date(c.scheduledAt).getTime() - now.getTime() >= 60 * 60 * 1000;
}
