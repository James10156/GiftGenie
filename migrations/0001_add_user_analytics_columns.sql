-- Migration: Ensure all required columns exist in user_analytics
ALTER TABLE user_analytics
  ADD COLUMN IF NOT EXISTS id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id varchar,
  ADD COLUMN IF NOT EXISTS session_id text NOT NULL,
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL,
  ADD COLUMN IF NOT EXISTS event_data jsonb,
  ADD COLUMN IF NOT EXISTS timestamp text DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Add foreign key constraint for user_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'user_analytics'
      AND constraint_name = 'user_analytics_user_id_fkey'
  ) THEN
    ALTER TABLE user_analytics
      ADD CONSTRAINT user_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END$$;
