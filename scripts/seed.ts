
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    }
});

const DATASET_ROOT = path.resolve(process.cwd(), '../');

async function readCSV(filePath: string): Promise<any[]> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

function getProdiFromKelas(kelas: string): string {
    const parts = kelas.split('-');
    if (parts.length > 0) return parts[0];
    return 'IF';
}

async function processTerm(folderName: string) {
    console.log(`\n\n=== Processing Term: ${folderName} ===`);
    const termPath = path.join(DATASET_ROOT, folderName);

    if (!fs.existsSync(termPath)) {
        console.log(`Folder ${folderName} not found. Skipping.`);
        return;
    }

    // 1. Process Praktikum
    console.log(`Step 1: Processing Praktikum...`);
    const praktikumRows = await readCSV(path.join(termPath, 'praktikum.csv'));
    const praktikumMap = new Map<string, string>(); // mk_singkat -> id (UUID)

    for (const row of praktikumRows) {
        // Table: Praktikum (PascalCase)
        // Schema: nama, tahun_ajaran
        // CSV: nama_singkat, tahun_ajaran

        const { data: existing } = await supabase
            .from('Praktikum')
            .select('id')
            .eq('nama', row.nama_singkat)
            .eq('tahun_ajaran', row.tahun_ajaran)
            .single();

        let pId;
        if (existing) {
            pId = existing.id;
        } else {
            const { data: inserted, error } = await supabase.from('Praktikum').insert({
                nama: row.nama_singkat,
                tahun_ajaran: row.tahun_ajaran
            }).select().single();
            if (error) { console.error('Error insert Praktikum:', error); continue; }
            pId = inserted.id;
        }
        praktikumMap.set(row.nama_singkat, pId);
    }
    console.log(`Processed ${praktikumMap.size} Praktikum entries.`);

    // 2. Process Mata Kuliah
    console.log(`Step 2: Processing Mata Kuliah...`);
    const mkRows = await readCSV(path.join(termPath, 'mata_kuliah.csv'));
    const mkMap = new Map<string, string>(); // key "mk_singkat|prodi" -> id

    for (const row of mkRows) {
        const pId = praktikumMap.get(row.mk_singkat);
        if (!pId) { console.warn(`Praktikum ID not found for MK: ${row.mk_singkat}`); continue; }

        // Table: Mata_Kuliah
        // Schema: id_praktikum, nama_lengkap, program_studi
        const { data: existing } = await supabase
            .from('Mata_Kuliah')
            .select('id')
            .eq('id_praktikum', pId)
            .eq('program_studi', row.program_studi)
            .single();

        let mkId;
        if (existing) {
            mkId = existing.id;
        } else {
            const { data: inserted, error } = await supabase.from('Mata_Kuliah').insert({
                id_praktikum: pId,
                nama_lengkap: row.nama_lengkap,
                program_studi: row.program_studi
            }).select().single();
            if (error) { console.error('Error insert Mata_Kuliah:', error); continue; }
            mkId = inserted.id;
        }
        mkMap.set(`${row.mk_singkat}|${row.program_studi}`, mkId);
    }
    console.log(`Processed ${mkRows.length} MK entries.`);

    // 3. Process Asprak
    console.log(`Step 3: Processing Asprak...`);
    const asprakRows = await readCSV(path.join(termPath, 'asprak.csv'));
    const asprakCodeMap = new Map<string, string>(); // code -> id

    for (const row of asprakRows) {
        // Table: Asprak
        const { data: existing } = await supabase
            .from('Asprak')
            .select('id')
            .eq('nim', row.nim)
            .single();

        let asprakId;
        if (existing) {
            await supabase.from('Asprak').update({
                kode: row.kode,
                angkatan: parseInt(row.angkatan) || 0,
                nama_lengkap: row.nama_lengkap
            }).eq('id', existing.id);
            asprakId = existing.id;
        } else {
            const { data: inserted, error } = await supabase.from('Asprak').insert({
                nim: row.nim,
                nama_lengkap: row.nama_lengkap,
                kode: row.kode,
                angkatan: parseInt(row.angkatan) || 0
            }).select().single();
            if (error) { console.error('Error insert Asprak:', row.nim, error); continue; }
            asprakId = inserted.id;
        }
        asprakCodeMap.set(row.kode, asprakId);
    }
    console.log(`Processed ${asprakRows.length} Asprak entries.`);

    // 4. Process Asprak_Praktikum
    console.log(`Step 4: Processing Asprak_Praktikum Assignments...`);
    const apRows = await readCSV(path.join(termPath, 'asprak_praktikum.csv'));

    for (const row of apRows) {
        const asprakId = asprakCodeMap.get(row.kode_asprak);
        const praktikumId = praktikumMap.get(row.mk_singkat);

        if (asprakId && praktikumId) {
            // Table: Asprak_Praktikum
            // We'll trust the DB constraints or just select check first since upsert complex with no PK known
            const { data: existing } = await supabase
                .from('Asprak_Praktikum')
                .select('id')
                .eq('id_asprak', asprakId)
                .eq('id_praktikum', praktikumId)
                .single();

            if (!existing) {
                const { error } = await supabase.from('Asprak_Praktikum').insert({
                    id_asprak: asprakId,
                    id_praktikum: praktikumId
                });
                if (error) console.error(`Error link Asprak_Praktikum: ${row.kode_asprak}-${row.mk_singkat}`, error);
            }
        }
    }
    console.log(`Assignments processed.`);

    // 5. Process Jadwal
    console.log(`Step 5: Processing Jadwal...`);
    const jadwalRows = await readCSV(path.join(termPath, 'jadwal.csv'));

    let jadwalInsertedCount = 0;
    for (const row of jadwalRows) {
        let prodi = getProdiFromKelas(row.kelas);

        let mkId = mkMap.get(`${row.nama_singkat}|${prodi}`);

        if (!mkId) {
            // Check if it is a PJJ class (check full class string)
            if (row.kelas.toString().toUpperCase().includes('PJJ')) {
                mkId = mkMap.get(`${row.nama_singkat}|IF-PJJ`);
            }
            // Fallbacks
            if (!mkId) {
                mkId = mkMap.get(`${row.nama_singkat}|IF`) ||
                    mkMap.get(`${row.nama_singkat}|SE`) ||
                    mkMap.get(`${row.nama_singkat}|IT`) ||
                    mkMap.get(`${row.nama_singkat}|DS`);
            }
        }

        if (mkId) {
            const hariUpper = row.hari ? row.hari.toString().toUpperCase().trim() : null;
            const ruanganTrimmed = row.ruangan ? row.ruangan.toString().trim() : null;

            if (!hariUpper) {
                console.warn(`Skipping row ${row.kelas} due to missing Hari.`);
                continue;
            }

            // Table: Jadwal
            const { error } = await supabase.from('Jadwal').insert({
                id_mk: mkId,
                kelas: row.kelas,
                hari: hariUpper,
                sesi: parseInt(row.sesi) || null,
                jam: row.jam || '00:00:00',
                ruangan: ruanganTrimmed,
                total_asprak: parseInt(row.total_asprak) || 0,
                dosen: row.dosen
            });
            if (error) console.error('Error insert Jadwal:', error.message);
            else jadwalInsertedCount++;
        } else {
            console.warn(`Skipping row ${row.kelas}: MK ID not found for '${row.nama_singkat}' (Prodi: ${prodi})`);
        }
    }
    console.log(`Inserted ${jadwalInsertedCount} Jadwal entries.`);
}

async function main() {
    const terms = ['2425-1', '2425-2', '2526-1', '2526-2'];
    for (const term of terms) {
        await processTerm(term);
    }
}

main().catch(console.error);
