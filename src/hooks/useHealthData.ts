import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { addActivityEntry } from '../services/activityLogs';
import {
  isHealthConnectAvailable,
  initHealthConnect,
  requestHealthPermissions,
  readTodayHealth,
  type HealthSummary,
} from '../services/healthConnect';

export function useHealthData(enabled: boolean) {
  const [data, setData] = useState<HealthSummary | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const ok = await isHealthConnectAvailable();
      if (!mounted) return;
      setAvailable(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      const inited = await initHealthConnect();
      if (!inited) {
        setLoading(false);
        return;
      }
      const granted = await requestHealthPermissions();
      if (!mounted) return;
      setGranted(granted);
      if (granted) {
        const summary = await readTodayHealth();
        if (mounted) setData(summary);
        const uid = auth.currentUser?.uid;
        if (uid && summary) {
          void addActivityEntry(uid, {
            steps: summary.steps,
            activeKcal: summary.caloriesBurned,
            totalKcal: summary.caloriesBurned,
            distanceKm: summary.distanceKm,
            sleepMin: summary.sleepMinutes,
          }).catch(() => {});
        }
      }
      if (mounted) setLoading(false);
    }

    if (enabled) boot();
    else setLoading(false);

    return () => { mounted = false; };
  }, [enabled]);

  useEffect(() => {
    if (!granted) return;
    const interval = setInterval(async () => {
      const summary = await readTodayHealth();
      if (summary) setData(summary);
      const uid = auth.currentUser?.uid;
      if (uid && summary) {
        void addActivityEntry(uid, {
          steps: summary.steps,
          activeKcal: summary.caloriesBurned,
          totalKcal: summary.caloriesBurned,
          distanceKm: summary.distanceKm,
          sleepMin: summary.sleepMinutes,
        }).catch(() => {});
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [granted]);

  return { data, available, granted, loading };
}