-- Test minimal schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Basic tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  username_base TEXT,
  discriminator INTEGER DEFAULT 1,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions BIGINT DEFAULT 0,
  UNIQUE(server_id, name)
);

CREATE TABLE server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  UNIQUE(server_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Servers viewable by members" ON servers FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = servers.id AND server_members.user_id = auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "Users can create servers" ON servers FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view memberships" ON server_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join servers" ON server_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Server members can view roles" ON roles FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = roles.server_id AND server_members.user_id = auth.uid()));

-- Simple function
CREATE OR REPLACE FUNCTION create_server_simple(
  server_name TEXT,
  owner_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  server_id UUID;
  admin_role_id UUID;
BEGIN
  -- Create server
  INSERT INTO servers (name, owner_id) VALUES (server_name, owner_id) RETURNING id INTO server_id;

  -- Create admin role
  INSERT INTO roles (server_id, name, permissions)
  VALUES (server_id, 'Admin', (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9) | (1 << 10) | (1 << 11) | (1 << 12) | (1 << 13) | (1 << 14) | (1 << 15))
  RETURNING id INTO admin_role_id;

  -- Add owner as member
  INSERT INTO server_members (server_id, user_id, role_id)
  VALUES (server_id, owner_id, admin_role_id);

  RETURN server_id;
END; $$;