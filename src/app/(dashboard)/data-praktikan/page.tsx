import { PraktikanClientWrapper } from './PraktikanClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Data Praktikan | Manajemen Asprak',
  description: 'Kelola data praktikan',
};

export default function DataPraktikanPage() {
  return <PraktikanClientWrapper />;
}
