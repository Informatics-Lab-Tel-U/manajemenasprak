-- =============================================================
-- Migration: Logbook Tables
-- Tanggal: 2026-09-04
-- Deskripsi: Membuat 4 tabel untuk fitur intern-logbook:
--   logbook_interns   — profil intern (terintegrasi Supabase Auth)
--   logbook_posts     — entri logbook / aktivitas harian
--   logbook_media     — lampiran media per post
--   logbook_post_tags — tagging antar-intern pada post
-- =============================================================

-- 1. Intern profile registry
--    id = Supabase Auth user ID (UUID dari auth.users)
CREATE TABLE IF NOT EXISTS "public"."logbook_interns" (
    "id"         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "name"       TEXT        NOT NULL,
    "email"      TEXT        UNIQUE NOT NULL,
    "code"       TEXT,                               -- inisial / kode intern
    "image"      TEXT,                               -- avatar URL
    "streak"     INTEGER     NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Logbook posts (aktivitas harian intern)
CREATE TABLE IF NOT EXISTS "public"."logbook_posts" (
    "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"       UUID        NOT NULL REFERENCES "public"."logbook_interns"("id") ON DELETE CASCADE,
    "pic_id"        UUID        REFERENCES "public"."pengguna"("id") ON DELETE SET NULL,  -- Aslab PIC dari pengguna
    "title"         TEXT        NOT NULL,
    "description"   JSONB,                           -- Tiptap JSON / rich content
    "is_public"     BOOLEAN     NOT NULL DEFAULT false,
    "is_verified"   BOOLEAN     NOT NULL DEFAULT false,
    "activity_date" DATE        NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Media lampiran per post
CREATE TABLE IF NOT EXISTS "public"."logbook_media" (
    "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id"    UUID        NOT NULL REFERENCES "public"."logbook_posts"("id") ON DELETE CASCADE,
    "url"        TEXT        NOT NULL,
    "order"      INTEGER     NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tagging intern pada post
CREATE TABLE IF NOT EXISTS "public"."logbook_post_tags" (
    "post_id" UUID NOT NULL REFERENCES "public"."logbook_posts"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "public"."logbook_interns"("id") ON DELETE CASCADE,
    PRIMARY KEY ("post_id", "user_id")
);

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS "idx_logbook_posts_user_id"       ON "public"."logbook_posts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_logbook_posts_activity_date" ON "public"."logbook_posts" ("activity_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_logbook_posts_is_public"     ON "public"."logbook_posts" ("is_public") WHERE "is_public" = true;
CREATE INDEX IF NOT EXISTS "idx_logbook_posts_pic_id"        ON "public"."logbook_posts" ("pic_id");
CREATE INDEX IF NOT EXISTS "idx_logbook_media_post_id"       ON "public"."logbook_media" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_logbook_post_tags_post_id"   ON "public"."logbook_post_tags" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_logbook_post_tags_user_id"   ON "public"."logbook_post_tags" ("user_id");

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION "public"."touch_logbook_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "trg_logbook_posts_updated_at"
    BEFORE UPDATE ON "public"."logbook_posts"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();

CREATE OR REPLACE TRIGGER "trg_logbook_interns_updated_at"
    BEFORE UPDATE ON "public"."logbook_interns"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();

CREATE OR REPLACE TRIGGER "trg_logbook_media_updated_at"
    BEFORE UPDATE ON "public"."logbook_media"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();
