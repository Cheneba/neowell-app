import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Loads data whenever the screen gains focus (so lists refresh after going back). */
export function useFocusData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);

  // Always call the latest `load` without re-subscribing on every render.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadRef.current());
      setError(undefined);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, loading, reload };
}
