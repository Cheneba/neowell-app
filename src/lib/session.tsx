import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type ApiClient, createApiClient, type TokenStore } from '@/api/client';
import type { Me } from '@/api/types';
import { API_URL } from './config';
import { storage } from './storage';

const TOKENS_KEY = 'neowell.tokens';

const tokenStore: TokenStore = {
  async get() {
    const raw = await storage.get(TOKENS_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: (tokens) => storage.set(TOKENS_KEY, JSON.stringify(tokens)),
  clear: () => storage.remove(TOKENS_KEY),
};

type Status = 'loading' | 'signedOut' | 'signedIn';

type Session = {
  status: Status;
  me: Me | null;
  api: ApiClient;
  signIn: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  setMe: (me: Me) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<Me | null>(null);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: API_URL,
        tokens: tokenStore,
        onSessionExpired: () => {
          setMe(null);
          setStatus('signedOut');
        },
      }),
    [],
  );

  // Restore a saved session on launch.
  useEffect(() => {
    (async () => {
      if (!(await tokenStore.get())) return setStatus('signedOut');
      try {
        setMe(await api.me());
        setStatus('signedIn');
      } catch {
        // Offline or expired: expired sessions are cleared by the client; offline users retry later.
        setStatus((await tokenStore.get()) ? 'signedIn' : 'signedOut');
      }
    })();
  }, [api]);

  const signIn = useCallback(
    async (phone: string, code: string) => {
      const pair = await api.verifyOtp(phone, code);
      await tokenStore.set({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
      setMe(await api.me());
      setStatus('signedIn');
    },
    [api],
  );

  const signOut = useCallback(async () => {
    const tokens = await tokenStore.get();
    if (tokens) await api.logout(tokens.refreshToken).catch(() => undefined);
    await tokenStore.clear();
    setMe(null);
    setStatus('signedOut');
  }, [api]);

  const value = useMemo(
    () => ({ status, me, api, signIn, signOut, setMe }),
    [status, me, api, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
