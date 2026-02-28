import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const globalAdmin = createAdminClient();

/**
 * Fetch maintenance mode status from system_config table.
 */
export async function getMaintenanceStatus(): Promise<boolean> {
  try {
    const { data, error } = await globalAdmin
      .from('system_config')
      .select('value_bool')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) {
      // If table doesn't exist yet or other error, default to false
      if (error.code !== 'PGRST116') { // PGRST116 is not found
          logger.error('Error fetching maintenance status:', error);
      }
      return false;
    }

    return !!data?.value_bool;
  } catch (err) {
    logger.error('Unexpected error fetching maintenance status:', err);
    return false;
  }
}

/**
 * Update maintenance mode status (Admin only).
 */
export async function setMaintenanceStatus(active: boolean, userId: string): Promise<void> {
  const { error } = await globalAdmin
    .from('system_config')
    .upsert({
      key: 'maintenance_mode',
      value_bool: active,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    });

  if (error) {
    logger.error('Error setting maintenance status:', error);
    throw new Error(`Gagal mengubah status maintenance: ${error.message}`);
  }
}
