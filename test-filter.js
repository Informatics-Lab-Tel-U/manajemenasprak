const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFilter() {
  const term = '2425-2';

  const { data: asprakData, error: aError } = await supabase
    .from('asprak')
    .select('*, asprak_praktikum!inner(praktikum!inner(tahun_ajaran))')
    .eq('asprak_praktikum.praktikum.tahun_ajaran', term)
    .order('nim', { ascending: true });

  console.log('Asprak filter error:', aError);
  console.log('Asprak filtered count:', asprakData?.length);

  const { data: allAsprak } = await supabase.from('asprak').select('id');
  console.log('All Asprak count:', allAsprak?.length);

  const { data: mkData, error: mkError } = await supabase
    .from('mata_kuliah')
    .select(
      `
      *,
      praktikum:praktikum!inner (
        id,
        nama,
        tahun_ajaran
      )
    `
    )
    .eq('praktikum.tahun_ajaran', term);

  console.log('MK filter error:', mkError);
  console.log('MK filtered count:', mkData?.length);

  const { data: allMk } = await supabase.from('mata_kuliah').select('id');
  console.log('All MK count:', allMk?.length);
}

testFilter();
