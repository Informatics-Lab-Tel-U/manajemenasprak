import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function getMaintenanceStatus(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_config')
      .select('value_bool')
      .eq('key', 'maintenance_mode')
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
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

export async function setMaintenanceStatus(active: boolean, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('system_config').upsert({
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
