-- Migration: Add INTERN and MAHASISWA to public.roles enum
-- Tanggal: 2026-09-04
-- Deskripsi: Menambahkan role INTERN (pengguna intern-logbook) dan MAHASISWA
--            ke dalam enum public.roles agar sistem manajemenasprak dapat
--            mengidentifikasi dan mengotorisasi pengguna dari layanan intern-logbook.

-- Tambah MAHASISWA ke enum public.roles (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'MAHASISWA'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'roles' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        ALTER TYPE "public"."roles" ADD VALUE 'MAHASISWA';
    END IF;
END$$;

-- Tambah INTERN ke enum public.roles (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'INTERN'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'roles' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        ALTER TYPE "public"."roles" ADD VALUE 'INTERN';
    END IF;
END$$;

-- Catatan: ALTER TYPE ADD VALUE tidak bisa di-rollback dalam satu transaksi.
-- Nilai enum yang sudah ditambah akan persistent di database.
-- Jika ingin "rollback", harus DROP TYPE dan recreate (hati-hati ada FK dependency).
