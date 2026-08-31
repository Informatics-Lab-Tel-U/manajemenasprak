'use client';

import dynamic from 'next/dynamic';
import type { Jadwal, MataKuliah } from '@/types/database';
import JadwalLoading from './loading';

interface Props {
  initialJadwal: Jadwal[];
  initialTerms: string[];
  initialMataKuliahList: MataKuliah[];
}

const JadwalClientPage = dynamic(() => import('./JadwalClientPage'), {
  ssr: false,
  loading: () => <JadwalLoading />,
});

export function JadwalClientWrapper(props: Props) {
  return <JadwalClientPage {...props} />;
}
