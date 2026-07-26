-- ============================================================================
-- Migration: 20260726_standardize_blog_post_tags.sql
-- Description: Standardize blog_post_tags table with surrogate primary key `id`
--              and update generic audit log function to handle join tables.
-- ============================================================================

-- 1. Update fn_generic_audit_log to support join tables (post_id) and unknown fallback
CREATE OR REPLACE FUNCTION public.fn_generic_audit_log() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_log (
    table_name, 
    record_id, 
    operation, 
    old_values, 
    new_values, 
    id_pengguna
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(
      to_jsonb(NEW) ->> 'id',
      to_jsonb(NEW) ->> 'key',
      to_jsonb(NEW) ->> 'post_id',
      to_jsonb(OLD) ->> 'id',
      to_jsonb(OLD) ->> 'key',
      to_jsonb(OLD) ->> 'post_id',
      'unknown'
    ),
    TG_OP,
    CASE 
      WHEN TG_OP = 'INSERT' THEN NULL
      ELSE to_jsonb(OLD)
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE to_jsonb(NEW)
    END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Alter blog_post_tags table to standardize with id primary key
ALTER TABLE public.blog_post_tags DROP CONSTRAINT IF EXISTS blog_post_tags_pkey;

ALTER TABLE public.blog_post_tags ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.blog_post_tags SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.blog_post_tags ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (id);

ALTER TABLE public.blog_post_tags DROP CONSTRAINT IF EXISTS blog_post_tags_post_tag_unique;
ALTER TABLE public.blog_post_tags ADD CONSTRAINT blog_post_tags_post_tag_unique UNIQUE (post_id, tag_id);
