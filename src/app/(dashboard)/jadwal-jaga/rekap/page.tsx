import React from 'react';
import RekapJagaClient from './RekapJagaClient';
import { getCachedAvailableTerms } from '@/services/termService';

export const metadata = {
  title: 'Rekap Jaga | Informatics Lab',
  description: 'Rekapitulasi jadwal jaga Asisten Praktikum',
};

export default async function RekapJagaPage() {
  const terms = await getCachedAvailableTerms();
  
  return <RekapJagaClient initialTerms={terms} />;
}
