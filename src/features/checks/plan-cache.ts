import type { CheckPlan } from '@/api/types';
import { storage } from '@/lib/storage';

/** Last plan per baby, type and complaints, so a check can still be filled in offline. */
const key = (babyId: string, type: string, complaints: string[], lang: string) =>
  `neowell.plan.${babyId}.${type}.${[...complaints].sort().join('_') || 'none'}.${lang}`;

export const planCache = {
  async get(babyId: string, type: string, complaints: string[], lang: string): Promise<CheckPlan | null> {
    try {
      const raw = await storage.get(key(babyId, type, complaints, lang));
      return raw ? (JSON.parse(raw) as CheckPlan) : null;
    } catch {
      return null;
    }
  },
  async set(babyId: string, plan: CheckPlan, lang: string) {
    await storage.set(key(babyId, plan.type, plan.complaints, lang), JSON.stringify(plan)).catch(() => undefined);
  },
};
