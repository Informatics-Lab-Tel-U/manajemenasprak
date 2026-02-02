import { Users, BookOpen, Calendar, AlertTriangle } from 'lucide-react';
import { Jadwal } from '@/types/database';
import DashboardCharts from '@/components/DashboardCharts';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStats } from '@/services/databaseService';
import { getTodaySchedule } from '@/services/jadwalService';
import DashboardClient from '@/components/DashboardClient';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { useDashboard } from '@/hooks/useDashboard';

export const revalidate = 0;

export default async function Home() {

  return (
    <div className="container">
      <DashboardClient />
    </div>
  );
}
