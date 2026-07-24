import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { LabStatus } from '@/store/useMonitoringStore';

export async function getMonitoringLabs(): Promise<LabStatus[]> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('monitoring_lab')
      .select('*')
      .order('lab_id', { ascending: true });

    if (error) {
      logger.error('Error fetching monitoring labs:', error);
      return [];
    }

    return (data || []) as LabStatus[];
  } catch (error) {
    logger.error('Exception fetching monitoring labs:', error);
    return [];
  }
}
