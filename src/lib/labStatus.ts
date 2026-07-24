export const OFFLINE_THRESHOLD_S = 60;
export const CLOCK_SKEW_TOLERANCE_S = 30;

export interface MinimalLabStatus {
  status: string;
  last_seen: string;
}

export function isLabOnline(lab: MinimalLabStatus, now: Date): boolean {
  const diffInSeconds = (now.getTime() - new Date(lab.last_seen).getTime()) / 1000;
  return lab.status !== 'offline' && diffInSeconds <= (OFFLINE_THRESHOLD_S + CLOCK_SKEW_TOLERANCE_S);
}
