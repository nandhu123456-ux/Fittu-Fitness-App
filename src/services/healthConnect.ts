import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export interface HealthSummary {
  steps: number;
  caloriesBurned: number;
  distanceKm: number;
  updatedAt: number;
}

const PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Distance' as const },
];

export async function isHealthConnectAvailable(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function initHealthConnect(): Promise<boolean> {
  try {
    return await initialize();
  } catch (e) {
    console.warn('[healthConnect] init failed', e);
    return false;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  try {
    const granted = await requestPermission(PERMISSIONS);
    return granted.length > 0;
  } catch (e) {
    console.warn('[healthConnect] permission failed', e);
    return false;
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

    const steps = stepsResult.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
    const activeCal = activeCalResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    const totalCal = totalCalResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    const distanceMeters = distanceResult.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters ?? 0), 0);

    return {
      steps: Math.round(steps),
      caloriesBurned: Math.round(activeCal || totalCal),
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.warn('[healthConnect] read failed', e);
    return null;
  }
}