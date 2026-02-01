
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function probeRuangan() {
    console.log("Probing Ruangan Enum...");

    // We need a valid MK ID first
    const { data: mk } = await supabase.from('Mata_Kuliah').select('id').limit(1).single();
    if (!mk) {
        console.error("No MK found.");
        return;
    }

    const candidates = [
        'TULT 0605',
        'TULT0605',
        'TULT-0605',
        'TULT_0605',
        'Tult 0605',
        'TULT 0605 ' // with space
    ];

    for (const r of candidates) {
        console.log(`Testing Ruangan: '${r}'`);
        const { error } = await supabase.from('Jadwal').insert({
            id_mk: mk.id,
            kelas: 'TEST-RUANGAN',
            hari: 'SENIN', // Known valid
            jam: '00:00:00',
            ruangan: r,
            total_asprak: 0
        });

        if (error) {
            console.log(`❌ Failed: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ MATCH! Valid Ruangan is: '${r}'`);
            await supabase.from('Jadwal').delete().eq('kelas', 'TEST-RUANGAN');
            break;
        }
    }
}

probeRuangan();
