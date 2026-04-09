import React from 'react';
import JadwalJagaClient from './JadwalJagaClient';
import { getCachedAvailableTerms } from '@/services/termService';
import { requireAuth } from '@/lib/auth';

export const metadata = {
  title: 'Input Jadwal Jaga | Informatics Lab',
  description: 'Pengelolaan dan Input Jadwal Jaga Asisten Praktikum',
};

export default async function JadwalJagaPage() {
  const user = await requireAuth();
  const terms = await getCachedAvailableTerms();
  
  return <JadwalJagaClient initialTerms={terms} userRole={user.pengguna.role} />;
}
