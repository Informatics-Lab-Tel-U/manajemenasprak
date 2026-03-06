// Re-export from the canonical databaseService location.
// This file exists to support imports from '@/services/server/databaseService'
// which some pages/routes use for clarity.
export { getStats, clearAllData, type DashboardStats } from '@/services/databaseService';
