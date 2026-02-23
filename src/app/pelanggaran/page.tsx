import { Pelanggaran } from '@/types/database';
import { getAllPelanggaran } from '@/services/pelanggaranService';
import PelanggaranClientPage from './PelanggaranClientPage';

export const revalidate = 0;

export default async function PelanggaranPage() {
  const violations = await getAllPelanggaran();

  return <PelanggaranClientPage violations={violations} />;
}