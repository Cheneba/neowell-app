import { NetworkError, type ApiClient } from '@/api/client';
import type { ObservationInput } from '@/api/types';
import { storage } from '@/lib/storage';

/**
 * Checks recorded without internet (FR-CHK-11). Each carries a clientRef, so re-sending
 * after a partial failure never creates a duplicate on the server.
 */
const KEY = 'neowell.offlineChecks';

export interface QueuedCheck {
  babyId: string;
  input: ObservationInput;
  queuedAt: string;
}

export function newClientRef(): string {
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `c${Date.now().toString(36)}${rand()}${rand()}`.slice(0, 40);
}

async function read(): Promise<QueuedCheck[]> {
  try {
    return JSON.parse((await storage.get(KEY)) ?? '[]') as QueuedCheck[];
  } catch {
    return [];
  }
}

async function write(items: QueuedCheck[]) {
  await storage.set(KEY, JSON.stringify(items));
}

export const offlineQueue = {
  list: read,
  async add(item: QueuedCheck) {
    await write([...(await read()), item]);
  },
  /** Sends queued checks in order; stops at the first network failure. Returns how many were sent. */
  async flush(api: Pick<ApiClient, 'createObservation'>): Promise<number> {
    const items = await read();
    let sent = 0;
    for (const item of items) {
      try {
        await api.createObservation(item.babyId, item.input);
        sent++;
      } catch (e) {
        if (e instanceof NetworkError) break;
        sent++; // a server-side rejection will not succeed later: drop it
      }
    }
    await write(items.slice(sent));
    return sent;
  },
};
