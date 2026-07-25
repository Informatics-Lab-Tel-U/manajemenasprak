import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import TahunAjaranBaruClient from './TahunAjaranBaruClient';

export default async function TahunAjaranBaruPage() {
  await requireAuth('/login');

  return <TahunAjaranBaruClient />;
}
