-- Script untuk membuat fungsi pencarian pelanggaran berdasarkan ranking global
-- Silakan jalankan script ini di SQL Editor Supabase Anda

CREATE OR REPLACE FUNCTION get_filtered_pelanggaran_ids(
    p_tahun_ajaran TEXT,
    p_target_modul INT,
    p_min_rank INT
)
RETURNS TABLE ( id UUID ) AS $$
BEGIN
    RETURN QUERY
    WITH RankedViolations AS (
        SELECT 
            p.id,
            p.modul,
            ROW_NUMBER() OVER (
                PARTITION BY p.id_asprak 
                ORDER BY p.modul ASC, p.created_at ASC
            ) as global_rank
        FROM pelanggaran p
        INNER JOIN jadwal j ON p.id_jadwal = j.id
        INNER JOIN mata_kuliah mk ON j.id_mk = mk.id
        INNER JOIN praktikum pr ON mk.id_praktikum = pr.id
        WHERE pr.tahun_ajaran = p_tahun_ajaran
    )
    SELECT rv.id
    FROM RankedViolations rv
    WHERE (p_target_modul IS NULL OR p_target_modul = 0 OR rv.modul = p_target_modul)
      AND rv.global_rank >= p_min_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
