import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export type HealthPermissionStatus =
  | 'unknown'
  | 'unavailable'
  | 'granted'
  | 'denied'
  | 'error';

export interface HealthSummary {
  steps: number;
  caloriesBurned: number;
  distanceKm: number;
  sleepMinutes: number;
  updatedAt: number;
}

const REQUIRED_PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Distance' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
];

export async function isHealthConnectAvailable(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    const available = status === SdkAvailabilityStatus.SDK_AVAILABLE;
    console.error('[HC] getSdkStatus:', status, '→ available:', available);
    return available;
  } catch (e) {
    console.error('[HC] getSdkStatus threw', e);
    return false;
  }
}

export async function initHealthConnect(): Promise<boolean> {
  try {
    const ok = await initialize();
    if (!ok) {
      console.error('[HC] initialize() returned false — provider not responding');
      return false;
    }
    console.error('[HC] initialize() succeeded');
    return true;
  } catch (e) {
    console.error('[HC] initialize() threw', e);
    return false;
  }
}

export async function requestHealthPermissions(): Promise<HealthPermissionStatus> {
  const available = await isHealthConnectAvailable();
  if (!available) {
    console.error('[HC] HC SDK not available — user must install Health Connect');
    return 'unavailable';
  }

  try {
    const ok = await initialize();
    if (!ok) {
      console.error('[HC] initialize() returned false — provider not responding');
      return 'unavailable';
    }
    console.error('[HC] initialize() succeeded');
  } catch (e) {
    console.error('[HC] initialize() threw', e);
    return 'error';
  }

  try {
    const already = await getGrantedPermissions();
    console.error('[HC] already granted:', already.length, 'of', REQUIRED_PERMISSIONS.length);
    if (already.length >= REQUIRED_PERMISSIONS.length) {
      return 'granted';
    }
  } catch (e) {
    console.error('[HC] getGrantedPermissions threw', e);
    return 'error';
  }

  try {
    console.error('[HC] calling requestPermission() — dialog should appear');
    const granted = await requestPermission([...REQUIRED_PERMISSIONS]);
    console.error('[HC] requestPermission() returned:', granted.length, 'grants');
    if (granted.length === REQUIRED_PERMISSIONS.length) return 'granted';
    return 'denied';
  } catch (e) {
    console.error('[HC] requestPermission() threw', e);
    return 'denied';
  }
}

export async function readTodayHealth(): Promise<HealthSummary | null> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    const [stepsResult, activeCalResult, totalCalResult, distanceResult] = await Promise.all([
      readRecords('Steps', { timeRangeFilter }),
      readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
      readRecords('TotalCaloriesBurned', { timeRangeFilter }),
      readRecords('Distance', { timeRangeFilter }),
    ]);

    const sleepStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 0, 0);
    const sleepEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const sleepResult = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: sleepStart.toISOString(),
        endTime: sleepEnd.toISOString(),
      },
    });

    let sleepMinutes = 0;
    for (const record of sleepResult.records as any[]) {
      const start = new Date(record.startTime);
      const end = new Date(record.endTime);
      sleepMinutes += (end.getTime() - start.getTime()) / 60000;
    }

    const steps = stepsResult.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
    const activeCal = activeCalResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    const totalCal = totalCalResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    const distanceMeters = distanceResult.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters ?? 0), 0);

    console.error('[HC] read success — steps:', steps, 'cal:', activeCal || totalCal);

    return {
      steps: Math.round(steps),
      caloriesBurned: Math.round(activeCal || totalCal),
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      sleepMinutes: Math.round(sleepMinutes),
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.error('[HC] readTodayHealth failed', e);
    return null;
  }
}
