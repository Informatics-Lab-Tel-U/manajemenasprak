import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TahunAjaranBaruClient from './TahunAjaranBaruClient';

export default async function TahunAjaranBaruPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect('/auth/login');
  }

  return <TahunAjaranBaruClient />;
}
