import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  aggregateRecord,
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
    console.log('[HC] getSdkStatus:', status, '→ available:', available);
    return available;
  } catch (e) {
    console.error('[HC] getSdkStatus threw', e);
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
    console.log('[HC] initialize() succeeded');
  } catch (e) {
    console.error('[HC] initialize() threw', e);
    return 'error';
  }

  try {
    const already = await getGrantedPermissions();
    console.log('[HC] already granted:', already.length, 'of', REQUIRED_PERMISSIONS.length);
    if (already.length >= REQUIRED_PERMISSIONS.length) {
      return 'granted';
    }
  } catch (e) {
    console.error('[HC] getGrantedPermissions threw', e);
    return 'error';
  }

  try {
    console.log('[HC] calling requestPermission() — dialog should appear');
    const granted = await requestPermission([...REQUIRED_PERMISSIONS]);
    console.log('[HC] requestPermission() returned:', granted.length, 'grants');
    if (granted.length >= REQUIRED_PERMISSIONS.length) return 'granted';
    return 'denied';
  } catch (e) {
    console.error('[HC] requestPermission() threw', e);
    return 'denied';
  }
}

export async function readTodayHealth(): Promise<HealthSummary | null> {
  try {
    const now = new Date();
    // Get exact local start of day
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    };

    console.log(`[HC] Reading data from ${startOfDay.toLocaleString()} to ${now.toLocaleString()}`);

    // --- 1. STEPS (with fallback) ---
    let steps = 0;
    try {
      const stepsResult = await aggregateRecord({ recordType: 'Steps', timeRangeFilter });
      steps = stepsResult.COUNT_TOTAL ?? 0;
      
      // Fallback: If aggregate returns 0, try reading raw records
      if (steps === 0) {
        const rawSteps = await readRecords('Steps', { timeRangeFilter });
        steps = rawSteps.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
      }
    } catch (e) {
      console.log('[HC] Aggregate steps failed, falling back to readRecords');
      const rawSteps = await readRecords('Steps', { timeRangeFilter });
      steps = rawSteps.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
    }

    // --- 2. ACTIVE CALORIES (with fallback) ---
    let activeCal = 0;
    try {
      const activeCalResult = await aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter });
      activeCal = activeCalResult.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
      
      if (activeCal === 0) {
        const rawCal = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
        activeCal = rawCal.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
      }
    } catch (e) {
      const rawCal = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      activeCal = rawCal.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    }

    // --- 3. DISTANCE (with fallback) ---
    let distanceMeters = 0;
    try {
      const distanceResult = await aggregateRecord({ recordType: 'Distance', timeRangeFilter });
      distanceMeters = distanceResult.DISTANCE?.inMeters ?? 0;
      
      if (distanceMeters === 0) {
        const rawDist = await readRecords('Distance', { timeRangeFilter });
        distanceMeters = rawDist.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters ?? 0), 0);
      }
    } catch (e) {
      const rawDist = await readRecords('Distance', { timeRangeFilter });
      distanceMeters = rawDist.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters ?? 0), 0);
    }

    // --- 4. TOTAL CALORIES ---
    const totalCalResult = await readRecords('TotalCaloriesBurned', { timeRangeFilter });
    const totalCal = totalCalResult.records.reduce(
      (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
      0
    );

    // --- 5. SLEEP ---
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

    console.log('[HC] read success — steps:', steps, 'cal:', activeCal || totalCal);

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