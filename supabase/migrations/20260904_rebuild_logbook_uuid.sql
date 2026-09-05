-- =============================================================
-- Migration: Buat tabel logbook dengan UUID Supabase Auth
-- =============================================================

-- Drop jika ada (CASCADE otomatis hapus trigger)
DROP TABLE IF EXISTS "public"."logbook_post_tags" CASCADE;
DROP TABLE IF EXISTS "public"."logbook_media" CASCADE;
DROP TABLE IF EXISTS "public"."logbook_posts" CASCADE;
DROP TABLE IF EXISTS "public"."logbook_interns" CASCADE;
DROP FUNCTION IF EXISTS "public"."touch_logbook_updated_at"() CASCADE;
DROP FUNCTION IF EXISTS "public"."sync_intern_from_auth"() CASCADE;

-- 1. Intern profile — id UUID dari auth.users Supabase
CREATE TABLE "public"."logbook_interns" (
    "id"         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "name"       TEXT        NOT NULL,
    "email"      TEXT        UNIQUE NOT NULL,
    "code"       TEXT,
    "image"      TEXT,
    "streak"     INTEGER     NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Logbook posts
CREATE TABLE "public"."logbook_posts" (
    "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"       UUID        NOT NULL REFERENCES "public"."logbook_interns"("id") ON DELETE CASCADE,
    "pic_id"        UUID        REFERENCES "public"."pengguna"("id") ON DELETE SET NULL,
    "title"         TEXT        NOT NULL,
    "description"   JSONB,
    "is_public"     BOOLEAN     NOT NULL DEFAULT false,
    "is_verified"   BOOLEAN     NOT NULL DEFAULT false,
    "activity_date" DATE        NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Media lampiran
CREATE TABLE "public"."logbook_media" (
    "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id"    UUID        NOT NULL REFERENCES "public"."logbook_posts"("id") ON DELETE CASCADE,
    "url"        TEXT        NOT NULL,
    "order"      INTEGER     NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tagging antar-intern
CREATE TABLE "public"."logbook_post_tags" (
    "post_id" UUID NOT NULL REFERENCES "public"."logbook_posts"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "public"."logbook_interns"("id") ON DELETE CASCADE,
    PRIMARY KEY ("post_id", "user_id")
);

-- Indexes
CREATE INDEX "idx_logbook_posts_user_id"       ON "public"."logbook_posts" ("user_id");
CREATE INDEX "idx_logbook_posts_activity_date" ON "public"."logbook_posts" ("activity_date" DESC);
CREATE INDEX "idx_logbook_posts_is_public"     ON "public"."logbook_posts" ("is_public") WHERE "is_public" = true;
CREATE INDEX "idx_logbook_posts_pic_id"        ON "public"."logbook_posts" ("pic_id");
CREATE INDEX "idx_logbook_media_post_id"       ON "public"."logbook_media" ("post_id");
CREATE INDEX "idx_logbook_post_tags_post_id"   ON "public"."logbook_post_tags" ("post_id");
CREATE INDEX "idx_logbook_post_tags_user_id"   ON "public"."logbook_post_tags" ("user_id");

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION "public"."touch_logbook_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_logbook_posts_updated_at"
    BEFORE UPDATE ON "public"."logbook_posts"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();

CREATE TRIGGER "trg_logbook_interns_updated_at"
    BEFORE UPDATE ON "public"."logbook_interns"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();

CREATE TRIGGER "trg_logbook_media_updated_at"
    BEFORE UPDATE ON "public"."logbook_media"
    FOR EACH ROW EXECUTE FUNCTION "public"."touch_logbook_updated_at"();

-- Auto-sync: buat profil intern saat user signup Supabase
CREATE OR REPLACE FUNCTION "public"."sync_intern_from_auth"()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'INTERN') = 'INTERN' THEN
    INSERT INTO "public"."logbook_interns" (id, name, email, code)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'code'
    )
    ON CONFLICT (id) DO UPDATE SET
        name       = EXCLUDED.name,
        email      = EXCLUDED.email,
        code       = COALESCE(EXCLUDED.code, logbook_interns.code),
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "trg_sync_intern_on_signup"
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION "public"."sync_intern_from_auth"();
