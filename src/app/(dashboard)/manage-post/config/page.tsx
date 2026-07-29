import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms } from '@/services/jadwalService';
import { getActiveScheduleTerm, getAslabTeamData } from '@/services/webConfigService.server';
import WebConfigClientPage from './WebConfigClientPage';
import AslabTeamManager from './AslabTeamManager';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function WebConfigPage() {
  await requireAuth();

  let terms: string[] = [];
  let activeTerm: string | null = null;
  let aslabTeamData = { koordinator: [], wakil_koordinator: [], asisten: [] };

  try {
    const res = await Promise.all([
      getCachedAvailableTerms(),
      getActiveScheduleTerm(),
      getAslabTeamData()
    ]);
    terms = res[0] || [];
    activeTerm = res[1];
    aslabTeamData = res[2] || { koordinator: [], wakil_koordinator: [], asisten: [] };
  } catch (error) {
    console.error('[WebConfigPage] SSR fetch failed:', error);
  }

  return (
    <Suspense 
      fallback={
        <div className="p-8 max-w-4xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        <WebConfigClientPage 
          initialTerms={terms} 
          initialActiveTerm={activeTerm} 
        />
        
        <AslabTeamManager initialData={aslabTeamData} />
      </div>
    </Suspense>
  );
}
