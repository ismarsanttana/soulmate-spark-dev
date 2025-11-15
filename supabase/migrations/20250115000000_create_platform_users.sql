/**
 * Platform Users Table
 * 
 * Stores admin/team/partner roles for users accessing UrbanByte admin panels.
 * This is separate from city-specific roles (which are in user_roles table).
 * 
 * Role Types:
 * - master: UrbanByte administrators (access to dash.urbanbyte.com.br)
 * - team: Municipality collaborators (access to colaborador.urbanbyte.com.br)
 * - partner: External partners (access to parceiro.urbanbyte.com.br)
 */

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('master', 'team', 'partner')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Index for faster role lookups
CREATE INDEX IF NOT EXISTS platform_users_user_id_idx ON platform_users(user_id);
CREATE INDEX IF NOT EXISTS platform_users_role_idx ON platform_users(role);

-- RLS Policies
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own platform role
CREATE POLICY "Users can read own platform role"
  ON platform_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only master users can insert/update/delete platform roles
CREATE POLICY "Master users can manage platform roles"
  ON platform_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_users
      WHERE user_id = auth.uid()
      AND role = 'master'
      AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER platform_users_updated_at
  BEFORE UPDATE ON platform_users
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_users_updated_at();

-- Comments
COMMENT ON TABLE platform_users IS 'Stores admin/team/partner roles for users accessing UrbanByte admin panels';
COMMENT ON COLUMN platform_users.role IS 'Platform role: master (UrbanByte admin), team (municipality), partner (external)';
COMMENT ON COLUMN platform_users.is_active IS 'Whether the user is currently active in this role';
