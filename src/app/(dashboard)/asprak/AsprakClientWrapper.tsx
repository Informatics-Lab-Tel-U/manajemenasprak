'use client';

import dynamic from 'next/dynamic';
import type { Asprak } from '@/types/database';
import type { ExistingNimInfo } from '@/utils/validation/asprakValidation';
import type { ExistingAsprakInfo } from '@/components/asprak/AsprakImportCSVModal';
import AsprakLoading from './loading';

interface Props {
  initialAsprakList: Asprak[];
  initialTerms: string[];
  initialExistingCodes: string[];
  initialExistingNims: ExistingNimInfo[];
  initialExistingAspraks: ExistingAsprakInfo[];
}

const AsprakClientPage = dynamic(() => import('./AsprakClientPage'), {
  ssr: false,
  loading: () => <AsprakLoading />,
});

export function AsprakClientWrapper(props: Props) {
  return <AsprakClientPage {...props} />;
}
