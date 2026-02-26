


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."Hari" AS ENUM (
    'SENIN',
    'SELASA',
    'RABU',
    'KAMIS',
    'JUMAT',
    'SABTU'
);


ALTER TYPE "public"."Hari" OWNER TO "postgres";


CREATE TYPE "public"."Jenis_Pelanggaran" AS ENUM (
    'tidak hadir',
    'telat nilai',
    'telat hadir'
);


ALTER TYPE "public"."Jenis_Pelanggaran" OWNER TO "postgres";


CREATE TYPE "public"."Program_Studi" AS ENUM (
    'IF',
    'IT',
    'DS',
    'SE',
    'IF-PJJ'
);


ALTER TYPE "public"."Program_Studi" OWNER TO "postgres";


CREATE TYPE "public"."Ruangan" AS ENUM (
    'TULT 0604',
    'TULT 0605',
    'TULT 0617',
    'TULT 0618',
    'TULT 0704',
    'TULT 0705',
    'TULT 0712',
    'TULT 0713'
);


ALTER TYPE "public"."Ruangan" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Asprak" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nama_lengkap" character varying(255) NOT NULL,
    "nim" character varying(20) NOT NULL,
    "kode" character varying(3) NOT NULL,
    "angkatan" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Asprak" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Asprak_Praktikum" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id_asprak" "uuid" NOT NULL,
    "id_praktikum" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Asprak_Praktikum" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Jadwal" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id_mk" "uuid" NOT NULL,
    "kelas" character varying(20) NOT NULL,
    "hari" "public"."Hari" NOT NULL,
    "sesi" integer,
    "jam" time without time zone NOT NULL,
    "ruangan" "public"."Ruangan",
    "total_asprak" integer DEFAULT 0 NOT NULL,
    "dosen" character varying(10),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Jadwal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Jadwal_Pengganti" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id_jadwal" "uuid" NOT NULL,
    "modul" integer NOT NULL,
    "tanggal" "date" NOT NULL,
    "hari" "public"."Hari" NOT NULL,
    "sesi" integer,
    "jam" time without time zone NOT NULL,
    "ruangan" "public"."Ruangan" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Jadwal_Pengganti" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Mata_Kuliah" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id_praktikum" "uuid" NOT NULL,
    "nama_lengkap" character varying(255) NOT NULL,
    "program_studi" "public"."Program_Studi" NOT NULL,
    "dosen_koor" character varying(10),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Mata_Kuliah" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Pelanggaran" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id_asprak" "uuid" NOT NULL,
    "id_jadwal" "uuid" NOT NULL,
    "modul" integer NOT NULL,
    "jenis" "public"."Jenis_Pelanggaran" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Pelanggaran" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Praktikum" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nama" character varying(50) NOT NULL,
    "tahun_ajaran" character varying(20) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Praktikum" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Asprak_Praktikum"
    ADD CONSTRAINT "Asprak_Praktikum_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Asprak"
    ADD CONSTRAINT "Asprak_nim_key" UNIQUE ("nim");



ALTER TABLE ONLY "public"."Asprak"
    ADD CONSTRAINT "Asprak_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Jadwal_Pengganti"
    ADD CONSTRAINT "Jadwal_Pengganti_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Jadwal"
    ADD CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Mata_Kuliah"
    ADD CONSTRAINT "Mata_Kuliah_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Pelanggaran"
    ADD CONSTRAINT "Pelanggaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Praktikum"
    ADD CONSTRAINT "Praktikum_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_asprak_nim" ON "public"."Asprak" USING "btree" ("nim");



CREATE UNIQUE INDEX "idx_asprak_praktikum_unique" ON "public"."Asprak_Praktikum" USING "btree" ("id_asprak", "id_praktikum");



CREATE INDEX "idx_jadwal_mk" ON "public"."Jadwal" USING "btree" ("id_mk");



CREATE INDEX "idx_jadwal_pengganti_jadwal" ON "public"."Jadwal_Pengganti" USING "btree" ("id_jadwal");



CREATE INDEX "idx_mata_kuliah_praktikum" ON "public"."Mata_Kuliah" USING "btree" ("id_praktikum");



CREATE INDEX "idx_pelanggaran_asprak" ON "public"."Pelanggaran" USING "btree" ("id_asprak");



CREATE INDEX "idx_pelanggaran_jadwal" ON "public"."Pelanggaran" USING "btree" ("id_jadwal");



CREATE INDEX "idx_praktikum_nama" ON "public"."Praktikum" USING "btree" ("nama");



CREATE UNIQUE INDEX "idx_praktikum_nama_tahun" ON "public"."Praktikum" USING "btree" ("nama", "tahun_ajaran");



CREATE OR REPLACE TRIGGER "update_asprak_praktikum_updated_at" BEFORE UPDATE ON "public"."Asprak_Praktikum" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_asprak_updated_at" BEFORE UPDATE ON "public"."Asprak" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jadwal_pengganti_updated_at" BEFORE UPDATE ON "public"."Jadwal_Pengganti" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jadwal_updated_at" BEFORE UPDATE ON "public"."Jadwal" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mata_kuliah_updated_at" BEFORE UPDATE ON "public"."Mata_Kuliah" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pelanggaran_updated_at" BEFORE UPDATE ON "public"."Pelanggaran" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_praktikum_updated_at" BEFORE UPDATE ON "public"."Praktikum" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."Asprak_Praktikum"
    ADD CONSTRAINT "Asprak_Praktikum_id_asprak_fkey" FOREIGN KEY ("id_asprak") REFERENCES "public"."Asprak"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Asprak_Praktikum"
    ADD CONSTRAINT "Asprak_Praktikum_id_praktikum_fkey" FOREIGN KEY ("id_praktikum") REFERENCES "public"."Praktikum"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Jadwal_Pengganti"
    ADD CONSTRAINT "Jadwal_Pengganti_id_jadwal_fkey" FOREIGN KEY ("id_jadwal") REFERENCES "public"."Jadwal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Jadwal"
    ADD CONSTRAINT "Jadwal_id_mk_fkey" FOREIGN KEY ("id_mk") REFERENCES "public"."Mata_Kuliah"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Mata_Kuliah"
    ADD CONSTRAINT "Mata_Kuliah_id_praktikum_fkey" FOREIGN KEY ("id_praktikum") REFERENCES "public"."Praktikum"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Pelanggaran"
    ADD CONSTRAINT "Pelanggaran_id_asprak_fkey" FOREIGN KEY ("id_asprak") REFERENCES "public"."Asprak"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Pelanggaran"
    ADD CONSTRAINT "Pelanggaran_id_jadwal_fkey" FOREIGN KEY ("id_jadwal") REFERENCES "public"."Jadwal"("id") ON DELETE CASCADE;



ALTER TABLE "public"."Asprak" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Asprak_Praktikum" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable delete for public" ON "public"."Asprak" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Asprak_Praktikum" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Jadwal" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Jadwal_Pengganti" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Mata_Kuliah" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Pelanggaran" FOR DELETE USING (true);



CREATE POLICY "Enable delete for public" ON "public"."Praktikum" FOR DELETE USING (true);



CREATE POLICY "Enable insert for public" ON "public"."Asprak" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Asprak_Praktikum" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Jadwal" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Jadwal_Pengganti" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Mata_Kuliah" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Pelanggaran" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for public" ON "public"."Praktikum" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read for public" ON "public"."Asprak" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Asprak_Praktikum" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Jadwal" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Jadwal_Pengganti" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Mata_Kuliah" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Pelanggaran" FOR SELECT USING (true);



CREATE POLICY "Enable read for public" ON "public"."Praktikum" FOR SELECT USING (true);



CREATE POLICY "Enable update for public" ON "public"."Asprak" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Asprak_Praktikum" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Jadwal" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Jadwal_Pengganti" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Mata_Kuliah" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Pelanggaran" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for public" ON "public"."Praktikum" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."Jadwal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Jadwal_Pengganti" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Mata_Kuliah" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Pelanggaran" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Praktikum" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."Asprak" TO "anon";
GRANT ALL ON TABLE "public"."Asprak" TO "authenticated";
GRANT ALL ON TABLE "public"."Asprak" TO "service_role";



GRANT ALL ON TABLE "public"."Asprak_Praktikum" TO "anon";
GRANT ALL ON TABLE "public"."Asprak_Praktikum" TO "authenticated";
GRANT ALL ON TABLE "public"."Asprak_Praktikum" TO "service_role";



GRANT ALL ON TABLE "public"."Jadwal" TO "anon";
GRANT ALL ON TABLE "public"."Jadwal" TO "authenticated";
GRANT ALL ON TABLE "public"."Jadwal" TO "service_role";



GRANT ALL ON TABLE "public"."Jadwal_Pengganti" TO "anon";
GRANT ALL ON TABLE "public"."Jadwal_Pengganti" TO "authenticated";
GRANT ALL ON TABLE "public"."Jadwal_Pengganti" TO "service_role";



GRANT ALL ON TABLE "public"."Mata_Kuliah" TO "anon";
GRANT ALL ON TABLE "public"."Mata_Kuliah" TO "authenticated";
GRANT ALL ON TABLE "public"."Mata_Kuliah" TO "service_role";



GRANT ALL ON TABLE "public"."Pelanggaran" TO "anon";
GRANT ALL ON TABLE "public"."Pelanggaran" TO "authenticated";
GRANT ALL ON TABLE "public"."Pelanggaran" TO "service_role";



GRANT ALL ON TABLE "public"."Praktikum" TO "anon";
GRANT ALL ON TABLE "public"."Praktikum" TO "authenticated";
GRANT ALL ON TABLE "public"."Praktikum" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































