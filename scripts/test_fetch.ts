
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Testing fetch with Anon Key...");

    // Test 1: Lowercase 'asprak'
    const { data: dataLower, error: errorLower } = await supabase.from('asprak').select('*').limit(1);
    console.log("Fetch 'asprak' (lower):", dataLower?.length, "rows. Error:", errorLower?.message);

    // Test 2: PascalCase 'Asprak'
    const { data: dataPascal, error: errorPascal } = await supabase.from('Asprak').select('*').limit(1);
    console.log("Fetch 'Asprak' (Pascal):", dataPascal?.length, "rows. Error:", errorPascal?.message);

    // Test 3: Relationship fetch (Jadwal -> Mata_Kuliah)
    // Try lowercase first
    const { data: relLower, error: relErrLower } = await supabase.from('jadwal').select('*, mata_kuliah(*)').limit(1);
    console.log("Fetch 'jadwal' + 'mata_kuliah':", relLower?.length, "rows. Error:", relErrLower?.message);

    if (relErrLower?.message?.includes('Could not find relation')) {
        // Try Pascal relationship
        const { data: relPascal, error: relErrPascal } = await supabase.from('Jadwal').select('*, Mata_Kuliah(*)').limit(1);
        console.log("Fetch 'Jadwal' + 'Mata_Kuliah':", relPascal?.length, "rows. Error:", relErrPascal?.message);
    }
}

testFetch();
