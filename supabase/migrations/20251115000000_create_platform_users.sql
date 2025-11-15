-- Create platform_users table for UrbanByte Control Center
-- This table manages internal team access (MASTER, TEAM, PARTNER)

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MASTER', 'TEAM', 'PARTNER')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_platform_users_role ON platform_users(role);

-- Enable RLS (Row Level Security)
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own platform_users record
CREATE POLICY "Users can read own platform_users record" 
ON platform_users FOR SELECT 
USING (auth.email() = email);

-- Policy: MASTER users can read all platform_users
CREATE POLICY "MASTER users can read all platform_users" 
ON platform_users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM platform_users 
    WHERE email = auth.email() AND role = 'MASTER'
  )
);

-- Policy: MASTER users can insert/update/delete platform_users
CREATE POLICY "MASTER users can manage platform_users" 
ON platform_users FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM platform_users 
    WHERE email = auth.email() AND role = 'MASTER'
  )
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on UPDATE
CREATE TRIGGER platform_users_updated_at
BEFORE UPDATE ON platform_users
FOR EACH ROW
EXECUTE FUNCTION update_platform_users_updated_at();

-- Comment for documentation
COMMENT ON TABLE platform_users IS 'Internal platform users for UrbanByte Control Center (MASTER, TEAM, PARTNER roles)';
