-- Migration: 20260820_presensi_jaga_rfid.sql
-- Description: Menambahkan kolom rfid_uid pada tabel asprak dan membuat tabel presensi_jaga untuk absensi realtime.

-- 1. Tambahkan kolom rfid_uid ke tabel asprak
ALTER TABLE "public"."asprak" 
ADD COLUMN IF NOT EXISTS "rfid_uid" character varying;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_asprak_rfid_uid_unique" 
ON "public"."asprak" ("rfid_uid") 
WHERE "rfid_uid" IS NOT NULL;

-- 2. Buat tabel presensi_jaga
CREATE TABLE IF NOT EXISTS "public"."presensi_jaga" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_asprak" "uuid" NOT NULL,
    "tahun_ajaran" character varying NOT NULL,
    "modul" integer NOT NULL,
    "hari" character varying NOT NULL,
    "shift" integer NOT NULL,
    "tanggal" "date" DEFAULT CURRENT_DATE NOT NULL,
    "waktu_masuk" timestamp with time zone DEFAULT "now"() NOT NULL,
    "waktu_keluar" timestamp with time zone,
    "status" character varying DEFAULT 'HADIR'::character varying NOT NULL,
    "device_id" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."presensi_jaga"
    ADD CONSTRAINT "presensi_jaga_pkey" PRIMARY KEY ("id");

-- Foreign key ke tabel asprak
ALTER TABLE ONLY "public"."presensi_jaga"
    ADD CONSTRAINT "presensi_jaga_id_asprak_fkey" FOREIGN KEY ("id_asprak") REFERENCES "public"."asprak"("id") ON DELETE CASCADE;

-- Unique constraint agar 1 asisten tidak tap masuk ganda di shift & tanggal yang sama
ALTER TABLE ONLY "public"."presensi_jaga"
    ADD CONSTRAINT "unique_presensi_asprak_shift_date" UNIQUE ("id_asprak", "tanggal", "shift");

-- Index untuk query performa tinggi
CREATE INDEX IF NOT EXISTS "idx_presensi_jaga_lookup" 
ON "public"."presensi_jaga" USING "btree" ("tahun_ajaran", "modul", "hari", "shift");

CREATE INDEX IF NOT EXISTS "idx_presensi_jaga_tanggal" 
ON "public"."presensi_jaga" USING "btree" ("tanggal" DESC);

CREATE INDEX IF NOT EXISTS "idx_presensi_jaga_asprak" 
ON "public"."presensi_jaga" USING "btree" ("id_asprak");

-- 3. Enable RLS
ALTER TABLE "public"."presensi_jaga" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Authenticated user dapat melihat presensi jaga" 
ON "public"."presensi_jaga" FOR SELECT TO "authenticated" 
USING (true);

CREATE POLICY "Anon dapat melihat presensi jaga untuk live view" 
ON "public"."presensi_jaga" FOR SELECT TO "anon" 
USING (true);

CREATE POLICY "Service role full access on presensi jaga" 
ON "public"."presensi_jaga" 
USING (("auth"."role"() = 'service_role'::"text")) 
WITH CHECK (("auth"."role"() = 'service_role'::"text"));

-- 5. Tambahkan ke Realtime Publication
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."presensi_jaga";

-- 6. Grants
GRANT ALL ON TABLE "public"."presensi_jaga" TO "anon";
GRANT ALL ON TABLE "public"."presensi_jaga" TO "authenticated";
GRANT ALL ON TABLE "public"."presensi_jaga" TO "service_role";
