-- Migration: Add user status and approval workflow columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
    END IF;
END$$;

ALTER TABLE pengguna 
  ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS nim VARCHAR(20),
  ADD COLUMN IF NOT EXISTS catatan_request TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES pengguna(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ensure all existing users are set to 'ACTIVE'
UPDATE pengguna SET status = 'ACTIVE' WHERE status IS NULL;

-- Set default for newly registered users going forward to PENDING
ALTER TABLE pengguna ALTER COLUMN status SET DEFAULT 'PENDING';
