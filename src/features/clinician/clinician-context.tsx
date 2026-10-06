import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import type { MyClinicianProfile } from '@/api/types';
import { useSession } from '@/lib/session';

type State = { profile: MyClinicianProfile | null; loading: boolean; error?: unknown; reload: () => Promise<void>; set: (p: MyClinicianProfile) => void };
const Ctx = createContext<State | null>(null);

/** The signed-in clinician's own profile; `null` until they complete setup (404). */
export function ClinicianProvider({ children }: { children: ReactNode }) {
  const { api } = useSession();
  const [profile, setProfile] = useState<MyClinicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();

  const reload = useCallback(
    () =>
      api.myClinician().then(
        (p) => {
          setProfile(p);
          setError(undefined);
          setLoading(false);
        },
        (e) => {
          if (e instanceof ApiError && e.status === 404) setProfile(null);
          else setError(e);
          setLoading(false);
        },
      ),
    [api],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return <Ctx.Provider value={{ profile, loading, error, reload, set: setProfile }}>{children}</Ctx.Provider>;
}

export function useClinician(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useClinician must be used inside <ClinicianProvider>');
  return ctx;
}
