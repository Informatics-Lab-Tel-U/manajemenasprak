
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testEnum() {
    console.log("Testing Hari Enum...");

    // We need a valid MK ID first
    const { data: mk } = await supabase.from('Mata_Kuliah').select('id').limit(1).single();
    if (!mk) {
        console.error("No MK found to test with.");
        return;
    }

    const testCases = ['SENIN', 'Senin', 'senin'];

    for (const val of testCases) {
        console.log(`Trying insert with Hari = '${val}'...`);
        const { error } = await supabase.from('Jadwal').insert({
            id_mk: mk.id,
            kelas: 'TEST-ENUM',
            hari: val,
            jam: '00:00:00',
            total_asprak: 0
        });

        if (error) {
            console.log(`❌ Failed: ${error.message}`);
        } else {
            console.log(`✅ SUCCESS! Valid Enum value is: '${val}'`);
            // Cleanup
            await supabase.from('Jadwal').delete().eq('kelas', 'TEST-ENUM');
            break;
        }
    }
}

testEnum();
