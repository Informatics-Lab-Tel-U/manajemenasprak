-- Script untuk membuat fungsi opsi unik data praktikan.
-- Jalankan script ini di SQL Editor Supabase sebelum memakai:
-- GET /api/praktikan?action=options

CREATE OR REPLACE FUNCTION public.get_praktikan_options()
RETURNS TABLE (
  kelas text[],
  mata_kuliah text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(array_agg(DISTINCT p.kelas ORDER BY p.kelas), ARRAY[]::varchar[])::text[] AS kelas,
    COALESCE(
      array_agg(DISTINCT p.mata_kuliah ORDER BY p.mata_kuliah),
      ARRAY[]::varchar[]
    )::text[] AS mata_kuliah
  FROM public.praktikan p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_praktikan_options() TO authenticated;
