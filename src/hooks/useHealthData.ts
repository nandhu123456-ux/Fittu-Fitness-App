import { useCallback, useEffect, useState } from 'react';
import {
  requestHealthPermissions,
  readTodayHealth,
  isHealthConnectAvailable,
  type HealthPermissionStatus,
  type HealthSummary,
} from '../services/healthConnect';

export interface HealthDataState {
  status: HealthPermissionStatus;
  data: HealthSummary | null;
  lastError: string | null;
  loading: boolean;
  requestPermissions: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHealthData(user: { uid: string } | null): HealthDataState {
  const [status, setStatus] = useState<HealthPermissionStatus>('unknown');
  const [data, setData] = useState<HealthSummary | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermissions = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      console.error('[useHealthData] requesting permissions...');
      const result = await requestHealthPermissions();
      setStatus(result);
      console.error('[useHealthData] permission result:', result);

      if (result === 'granted') {
        const summary = await readTodayHealth();
        if (summary) {
          setData(summary);
          console.error('[useHealthData] data loaded:', summary.steps, 'steps');
        } else {
          setLastError('Could not read health data');
          console.error('[useHealthData] data read returned null');
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setLastError(msg);
      setStatus('error');
      console.error('[useHealthData] exception:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (status !== 'granted') return;
    try {
      const summary = await readTodayHealth();
      if (summary) setData(summary);
      else {
        setLastError('Could not read health data');
      }
    } catch (e) {
      console.error('[useHealthData] refresh failed', e);
    }
  }, [status]);

  useEffect(() => {
    if (user && status === 'unknown') {
      void requestPermissions();
    }
  }, [user, status, requestPermissions]);

  useEffect(() => {
    if (status !== 'granted') return;
    const id = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(id);
  }, [status, refresh]);

  return { status, data, lastError, loading, requestPermissions, refresh };
}
