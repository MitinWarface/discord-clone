-- Discord Clone Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
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

-- Servers table
CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, name)
);

-- Channels table
CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Pinned messages table
CREATE TABLE pinned_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

-- File attachments table
CREATE TABLE file_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Roles table
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99aab5',
  position INTEGER DEFAULT 0,
  permissions BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, name)
);

-- Server members table
CREATE TABLE server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Server invites table
CREATE TABLE server_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server bans table
CREATE TABLE server_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Direct message channels table
CREATE TABLE dm_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct message channel members table
CREATE TABLE dm_channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dm_channel_id UUID REFERENCES dm_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dm_channel_id, user_id)
);

-- User presence/status table
CREATE TABLE user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
);

-- Role permissions table
CREATE TABLE role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Categories are viewable by server members" ON categories FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = categories.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server members and owners can create categories" ON categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = categories.server_id AND server_members.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM servers WHERE servers.id = categories.server_id AND servers.owner_id = auth.uid()));
CREATE POLICY "Server members can update categories" ON categories FOR UPDATE USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = categories.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server members can delete categories" ON categories FOR DELETE USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = categories.server_id AND server_members.user_id = auth.uid()));

CREATE POLICY "Servers are viewable by members" ON servers FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = servers.id AND server_members.user_id = auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "Users can create servers" ON servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Server owners can update their servers" ON servers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Server owners can delete their servers" ON servers FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Channels are viewable by server members" ON channels FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = channels.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server members and owners can create channels" ON channels FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = channels.server_id AND server_members.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM servers WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()));
CREATE POLICY "Server members can update channels" ON channels FOR UPDATE USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = channels.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server members can delete channels" ON channels FOR DELETE USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = channels.server_id AND server_members.user_id = auth.uid()));

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are viewable by server members" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM channels c JOIN server_members sm ON sm.server_id = c.server_id WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()));
CREATE POLICY "Server members can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM channels c JOIN server_members sm ON sm.server_id = c.server_id WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reactions are viewable by server members" ON reactions FOR SELECT USING (EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = reactions.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Server members can insert reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = reactions.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Pinned messages are viewable by server members" ON pinned_messages FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = (SELECT server_id FROM channels WHERE id = pinned_messages.channel_id) AND server_members.user_id = auth.uid()));
CREATE POLICY "Server members with manage messages permission can pin messages" ON pinned_messages FOR INSERT WITH CHECK (auth.uid() = pinned_by AND has_permission(auth.uid(), (SELECT server_id FROM channels WHERE id = pinned_messages.channel_id), 'manage_messages'));
CREATE POLICY "Server members with manage messages permission can unpin messages" ON pinned_messages FOR DELETE USING (has_permission(auth.uid(), (SELECT server_id FROM channels WHERE id = pinned_messages.channel_id), 'manage_messages'));

CREATE POLICY "File attachments are viewable by server members" ON file_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = file_attachments.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can upload file attachments to their messages" ON file_attachments FOR INSERT WITH CHECK (auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM messages WHERE messages.id = file_attachments.message_id AND messages.user_id = auth.uid()));
CREATE POLICY "Users can delete their own file attachments" ON file_attachments FOR DELETE USING (auth.uid() = uploaded_by);

CREATE POLICY "Mentions are viewable by mentioned users and server members" ON mentions FOR SELECT USING (auth.uid() = mentioned_user_id OR EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = mentions.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can create mentions in their messages" ON mentions FOR INSERT WITH CHECK (auth.uid() = mentioned_by AND EXISTS (SELECT 1 FROM messages WHERE messages.id = mentions.message_id AND messages.user_id = auth.uid()));

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own friendships" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendships" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friendships" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can view their own memberships" ON server_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join servers" ON server_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave servers" ON server_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Server members can view roles" ON roles FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = roles.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server owners and role managers can create roles" ON roles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM servers WHERE servers.id = roles.server_id AND (servers.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM server_members sm JOIN roles r ON r.id = sm.role_id WHERE sm.server_id = roles.server_id AND sm.user_id = auth.uid() AND (r.permissions & (1 << 1)) != 0))));
CREATE POLICY "Server owners and role managers can update roles" ON roles FOR UPDATE USING (EXISTS (SELECT 1 FROM servers WHERE servers.id = roles.server_id AND (servers.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM server_members sm JOIN roles r ON r.id = sm.role_id WHERE sm.server_id = roles.server_id AND sm.user_id = auth.uid() AND (r.permissions & (1 << 1)) != 0))));

CREATE POLICY "Authenticated users can view permissions" ON permissions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Server members can view role permissions" ON role_permissions FOR SELECT USING (EXISTS (SELECT 1 FROM roles r JOIN server_members sm ON sm.server_id = r.server_id WHERE r.id = role_permissions.role_id AND sm.user_id = auth.uid()));
CREATE POLICY "Role managers can manage role permissions" ON role_permissions FOR ALL USING (EXISTS (SELECT 1 FROM roles r JOIN servers s ON s.id = r.server_id WHERE r.id = role_permissions.role_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM server_members sm JOIN roles user_r ON user_r.id = sm.role_id WHERE sm.server_id = r.server_id AND sm.user_id = auth.uid() AND (user_r.permissions & (1 << 1)) != 0))));

-- Server invites policies
CREATE POLICY "Server invites are viewable by server members" ON server_invites FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_invites.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server invites can be created by members with permission" ON server_invites FOR INSERT WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_invites.server_id AND server_members.user_id = auth.uid()) AND has_permission(auth.uid(), server_invites.server_id, 'manage_server'));
CREATE POLICY "Server invites can be managed by creators or admins" ON server_invites FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM servers WHERE servers.id = server_invites.server_id AND servers.owner_id = auth.uid()) OR has_permission(auth.uid(), server_invites.server_id, 'manage_server'));
CREATE POLICY "Server invites can be deleted by creators or admins" ON server_invites FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM servers WHERE servers.id = server_invites.server_id AND servers.owner_id = auth.uid()) OR has_permission(auth.uid(), server_invites.server_id, 'manage_server'));

-- Server bans policies
CREATE POLICY "Server bans are viewable by server members" ON server_bans FOR SELECT USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_bans.server_id AND server_members.user_id = auth.uid()));
CREATE POLICY "Server bans can be created by moderators" ON server_bans FOR INSERT WITH CHECK (auth.uid() = banned_by AND EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_bans.server_id AND server_members.user_id = auth.uid()) AND has_permission(auth.uid(), server_bans.server_id, 'ban_members'));
CREATE POLICY "Server bans can be managed by moderators" ON server_bans FOR UPDATE USING (auth.uid() = banned_by OR EXISTS (SELECT 1 FROM servers WHERE servers.id = server_bans.server_id AND servers.owner_id = auth.uid()) OR has_permission(auth.uid(), server_bans.server_id, 'ban_members'));
CREATE POLICY "Server bans can be deleted by moderators" ON server_bans FOR DELETE USING (auth.uid() = banned_by OR EXISTS (SELECT 1 FROM servers WHERE servers.id = server_bans.server_id AND servers.owner_id = auth.uid()) OR has_permission(auth.uid(), server_bans.server_id, 'ban_members'));

-- Direct message policies
CREATE POLICY "Users can view their DM channels" ON dm_channels FOR SELECT USING (EXISTS (SELECT 1 FROM dm_channel_members WHERE dm_channel_members.dm_channel_id = dm_channels.id AND dm_channel_members.user_id = auth.uid()));
CREATE POLICY "Users can create DM channels" ON dm_channels FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "DM channel members can update their channels" ON dm_channels FOR UPDATE USING (EXISTS (SELECT 1 FROM dm_channel_members WHERE dm_channel_members.dm_channel_id = dm_channels.id AND dm_channel_members.user_id = auth.uid()));

-- DM channel members policies
CREATE POLICY "Users can view their DM memberships" ON dm_channel_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join DM channels" ON dm_channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave DM channels" ON dm_channel_members FOR DELETE USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Anyone can view user presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update their own presence" ON user_presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own presence" ON user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default roles function
CREATE OR REPLACE FUNCTION create_default_roles() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE admin_role_id UUID;
BEGIN
  -- Create roles (only if they don't exist)
  INSERT INTO roles (server_id, name, color, position, permissions)
  VALUES (NEW.id, '@everyone', '#99aab5', 0, (1 << 5) | (1 << 6) | (1 << 8) | (1 << 9) | (1 << 11) | (1 << 12))
  ON CONFLICT (server_id, name) DO NOTHING;

  INSERT INTO roles (server_id, name, color, position, permissions)
  VALUES (NEW.id, 'Admin', '#ff0000', 100, (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8) | (1 << 9) | (1 << 10) | (1 << 11) | (1 << 12) | (1 << 13) | (1 << 14) | (1 << 15))
  ON CONFLICT (server_id, name) DO NOTHING;

  -- Get admin role ID
  SELECT r.id INTO admin_role_id FROM roles r WHERE r.server_id = NEW.id AND r.name = 'Admin';

  -- Create default category and channel (only if no categories exist)
  IF NOT EXISTS (SELECT 1 FROM categories WHERE server_id = NEW.id) THEN
    DECLARE text_category_id UUID;
    BEGIN
      INSERT INTO categories (server_id, name, position) VALUES (NEW.id, 'Текстовые каналы', 0) RETURNING id INTO text_category_id;
      INSERT INTO channels (server_id, category_id, name, type, position) VALUES (NEW.id, text_category_id, 'general', 'text', 0);
    END;
  END IF;

  -- Add owner as member (only if not already a member)
  IF NOT EXISTS (SELECT 1 FROM server_members WHERE server_id = NEW.id AND user_id = NEW.owner_id) THEN
    INSERT INTO server_members (server_id, user_id, role_id) VALUES (NEW.id, NEW.owner_id, admin_role_id);
  END IF;

  RETURN NEW;
END; $$;

-- Function to create server with template
CREATE OR REPLACE FUNCTION create_server_with_template(
  server_name TEXT,
  owner_id UUID,
  template_type TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_server_id UUID;
  v_admin_role_id UUID;
  v_category_id UUID;
BEGIN
  -- Validate input parameters
  IF server_name IS NULL OR trim(server_name) = '' THEN
    RAISE EXCEPTION 'Server name cannot be empty';
  END IF;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Owner ID cannot be null';
  END IF;

  -- Create server (this will trigger create_default_roles and create the roles)
  INSERT INTO servers (name, owner_id) VALUES (server_name, owner_id) RETURNING id INTO v_server_id;

  -- Get admin role ID (created by the trigger)
  SELECT r.id INTO v_admin_role_id
  FROM roles r
  WHERE r.server_id = v_server_id AND r.name = 'Admin';

  -- Create default category and channel (only if they don't exist)
  INSERT INTO categories (server_id, name, position)
  VALUES (v_server_id, 'Текстовые каналы', 0)
  ON CONFLICT (server_id, name) DO NOTHING;

  -- Get category ID
  SELECT c.id INTO v_category_id
  FROM categories c
  WHERE c.server_id = v_server_id AND c.name = 'Текстовые каналы';

  -- Create channel if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM channels WHERE server_id = v_server_id AND name = 'general') THEN
    INSERT INTO channels (server_id, category_id, name, type, position)
    VALUES (v_server_id, v_category_id, 'general', 'text', 0);
  END IF;

  -- Add owner as member (only if not already a member)
  INSERT INTO server_members (server_id, user_id, role_id)
  VALUES (v_server_id, owner_id, v_admin_role_id)
  ON CONFLICT (server_id, user_id) DO NOTHING;

  RETURN v_server_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating server: %', SQLERRM;
END; $$;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_status TEXT DEFAULT 'online'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (p_user_id, p_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = EXCLUDED.updated_at;
END; $$;

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Check user notification settings
  IF EXISTS (
    SELECT 1 FROM notification_settings
    WHERE user_id = p_user_id
    AND (p_type = 'mention' AND mentions = false)
       OR (p_type = 'message' AND messages = false)
       OR (p_type = 'friend_request' AND friend_requests = false)
       OR (p_type = 'server_invite' AND server_invites = false)
       OR (p_type = 'system' AND system = false)
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, title, content, data)
  VALUES (p_user_id, p_type, p_title, p_content, p_data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

CREATE TRIGGER create_default_roles_trigger AFTER INSERT ON servers FOR EACH ROW EXECUTE FUNCTION create_default_roles();

-- Permissions function
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, server_id UUID, permission_id TEXT) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_permissions BIGINT := 0; role_permissions BIGINT;
BEGIN
  -- Check if user is server owner
  IF EXISTS (SELECT 1 FROM servers WHERE id = server_id AND owner_id = user_id) THEN RETURN TRUE; END IF;

  -- Get combined permissions from all user roles
  SELECT COALESCE(bit_or(r.permissions), 0) INTO user_permissions
  FROM server_members sm
  JOIN roles r ON r.id = sm.role_id
  WHERE sm.server_id = server_id AND sm.user_id = user_id;

  CASE permission_id
    WHEN 'manage_server' THEN RETURN (user_permissions & (1 << 0)) != 0;
    WHEN 'manage_roles' THEN RETURN (user_permissions & (1 << 1)) != 0;
    WHEN 'manage_channels' THEN RETURN (user_permissions & (1 << 2)) != 0;
    WHEN 'kick_members' THEN RETURN (user_permissions & (1 << 3)) != 0;
    WHEN 'ban_members' THEN RETURN (user_permissions & (1 << 4)) != 0;
    WHEN 'send_messages' THEN RETURN (user_permissions & (1 << 5)) != 0;
    WHEN 'read_messages' THEN RETURN (user_permissions & (1 << 6)) != 0;
    WHEN 'manage_messages' THEN RETURN (user_permissions & (1 << 7)) != 0;
    WHEN 'embed_links' THEN RETURN (user_permissions & (1 << 8)) != 0;
    WHEN 'attach_files' THEN RETURN (user_permissions & (1 << 9)) != 0;
    WHEN 'mention_everyone' THEN RETURN (user_permissions & (1 << 10)) != 0;
    WHEN 'use_voice' THEN RETURN (user_permissions & (1 << 11)) != 0;
    WHEN 'speak' THEN RETURN (user_permissions & (1 << 12)) != 0;
    WHEN 'mute_members' THEN RETURN (user_permissions & (1 << 13)) != 0;
    WHEN 'deafen_members' THEN RETURN (user_permissions & (1 << 14)) != 0;
    WHEN 'move_members' THEN RETURN (user_permissions & (1 << 15)) != 0;
    ELSE RETURN FALSE;
  END CASE;
END; $$;

-- Search users function
CREATE OR REPLACE FUNCTION search_users(search_term TEXT) RETURNS TABLE (id UUID, username TEXT, display_name TEXT, avatar TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT p.id, p.username, p.display_name, p.avatar_url as avatar FROM profiles p WHERE p.username ILIKE '%' || search_term || '%' OR p.display_name ILIKE '%' || search_term || '%' ORDER BY CASE WHEN p.username ILIKE search_term || '%' THEN 1 WHEN p.display_name ILIKE search_term || '%' THEN 2 ELSE 3 END, p.username;
END; $$;

-- Search messages function
CREATE OR REPLACE FUNCTION search_messages(
  p_search_term TEXT,
  p_server_id UUID DEFAULT NULL,
  p_channel_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  content TEXT,
  user_id UUID,
  channel_id UUID,
  message_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  channel_name TEXT,
  server_name TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if user has permission to search in the specified scope
  IF p_server_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM server_members
    WHERE server_id = p_server_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not a member of this server';
  END IF;

  IF p_channel_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM channels c
    JOIN server_members sm ON sm.server_id = c.server_id
    WHERE c.id = p_channel_id AND sm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User does not have access to this channel';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.user_id,
    m.channel_id,
    m.message_type,
    m.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    ch.name as channel_name,
    s.name as server_name
  FROM messages m
  JOIN profiles p ON p.id = m.user_id
  JOIN channels ch ON ch.id = m.channel_id
  JOIN servers s ON s.id = ch.server_id
  WHERE
    m.content ILIKE '%' || p_search_term || '%' AND
    (p_server_id IS NULL OR s.id = p_server_id) AND
    (p_channel_id IS NULL OR ch.id = p_channel_id) AND
    (p_user_id IS NULL OR m.user_id = p_user_id) AND
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = s.id AND sm.user_id = auth.uid()
    )
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END; $$;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END; $$;

-- Function to create server invite
CREATE OR REPLACE FUNCTION create_server_invite(
  p_server_id UUID,
  p_created_by UUID,
  p_max_uses INTEGER DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  invite_code TEXT;
  existing_count INTEGER;
BEGIN
  -- Check if user has permission to create invites
  IF NOT has_permission(p_created_by, p_server_id, 'manage_server') THEN
    RAISE EXCEPTION 'User does not have permission to create invites';
  END IF;

  -- Generate unique code
  LOOP
    invite_code := generate_invite_code();
    SELECT COUNT(*) INTO existing_count FROM server_invites WHERE code = invite_code;
    EXIT WHEN existing_count = 0;
  END LOOP;

  -- Create invite
  INSERT INTO server_invites (server_id, code, created_by, max_uses, expires_at)
  VALUES (p_server_id, invite_code, p_created_by, p_max_uses, p_expires_at);

  RETURN invite_code;
END; $$;

-- Function to accept server invite
CREATE OR REPLACE FUNCTION accept_server_invite(
  p_invite_code TEXT,
  p_user_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  invite_record RECORD;
  server_id UUID;
  default_role_id UUID;
BEGIN
  -- Get invite details
  SELECT * INTO invite_record FROM server_invites WHERE code = p_invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  -- Check if invite is expired
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  -- Check if invite has reached max uses
  IF invite_record.max_uses IS NOT NULL AND invite_record.uses >= invite_record.max_uses THEN
    RAISE EXCEPTION 'Invite has reached maximum uses';
  END IF;

  -- Check if user is already a member
  IF EXISTS (SELECT 1 FROM server_members WHERE server_id = invite_record.server_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'User is already a member of this server';
  END IF;

  -- Get default role (@everyone)
  SELECT r.id INTO default_role_id
  FROM roles r
  WHERE r.server_id = invite_record.server_id AND r.name = '@everyone';

  -- Add user to server
  INSERT INTO server_members (server_id, user_id, role_id)
  VALUES (invite_record.server_id, p_user_id, default_role_id);

  -- Increment invite uses
  UPDATE server_invites SET uses = uses + 1 WHERE id = invite_record.id;

  RETURN invite_record.server_id;
END; $$;

-- Function to ban user from server
CREATE OR REPLACE FUNCTION ban_server_user(
  p_server_id UUID,
  p_user_id UUID,
  p_banned_by UUID,
  p_reason TEXT DEFAULT NULL,
  p_duration_hours INTEGER DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if banner has permission
  IF NOT has_permission(p_banned_by, p_server_id, 'ban_members') THEN
    RAISE EXCEPTION 'User does not have permission to ban members';
  END IF;

  -- Cannot ban server owner
  IF EXISTS (SELECT 1 FROM servers WHERE id = p_server_id AND owner_id = p_user_id) THEN
    RAISE EXCEPTION 'Cannot ban server owner';
  END IF;

  -- Cannot ban yourself
  IF p_banned_by = p_user_id THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  -- Calculate expiration if duration provided
  IF p_duration_hours IS NOT NULL THEN
    expires_at := NOW() + INTERVAL '1 hour' * p_duration_hours;
  END IF;

  -- Remove user from server first
  DELETE FROM server_members WHERE server_id = p_server_id AND user_id = p_user_id;

  -- Add ban record
  INSERT INTO server_bans (server_id, user_id, banned_by, reason, expires_at)
  VALUES (p_server_id, p_user_id, p_banned_by, p_reason, expires_at)
  ON CONFLICT (server_id, user_id) DO UPDATE SET
    banned_by = p_banned_by,
    reason = p_reason,
    expires_at = expires_at,
    created_at = NOW();
END; $$;

-- Function to unban user from server
CREATE OR REPLACE FUNCTION unban_server_user(
  p_server_id UUID,
  p_user_id UUID,
  p_unbanned_by UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if unbanned has permission
  IF NOT has_permission(p_unbanned_by, p_server_id, 'ban_members') THEN
    RAISE EXCEPTION 'User does not have permission to unban members';
  END IF;

  -- Remove ban record
  DELETE FROM server_bans WHERE server_id = p_server_id AND user_id = p_user_id;
END; $$;

-- Function to kick user from server
CREATE OR REPLACE FUNCTION kick_server_user(
  p_server_id UUID,
  p_user_id UUID,
  p_kicked_by UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if kicker has permission
  IF NOT has_permission(p_kicked_by, p_server_id, 'kick_members') THEN
    RAISE EXCEPTION 'User does not have permission to kick members';
  END IF;

  -- Cannot kick server owner
  IF EXISTS (SELECT 1 FROM servers WHERE id = p_server_id AND owner_id = p_user_id) THEN
    RAISE EXCEPTION 'Cannot kick server owner';
  END IF;

  -- Cannot kick yourself
  IF p_kicked_by = p_user_id THEN
    RAISE EXCEPTION 'Cannot kick yourself';
  END IF;

  -- Remove user from server
  DELETE FROM server_members WHERE server_id = p_server_id AND user_id = p_user_id;
END; $$;

-- Function to create or get DM channel between two users
CREATE OR REPLACE FUNCTION create_dm_channel(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dm_channel_id UUID;
  v_existing_channel_id UUID;
BEGIN
  -- Check if DM channel already exists between these users
  SELECT dm.dm_channel_id INTO v_existing_channel_id
  FROM dm_channel_members dm1
  JOIN dm_channel_members dm2 ON dm1.dm_channel_id = dm2.dm_channel_id
  WHERE dm1.user_id = p_user1_id AND dm2.user_id = p_user2_id
  AND dm1.dm_channel_id IN (
    SELECT dm_channel_id FROM dm_channel_members
    GROUP BY dm_channel_id HAVING COUNT(*) = 2
  )
  LIMIT 1;

  IF v_existing_channel_id IS NOT NULL THEN
    RETURN v_existing_channel_id;
  END IF;

  -- Create new DM channel
  INSERT INTO dm_channels (created_by) VALUES (p_user1_id) RETURNING id INTO v_dm_channel_id;

  -- Add both users to the channel
  INSERT INTO dm_channel_members (dm_channel_id, user_id) VALUES
    (v_dm_channel_id, p_user1_id),
    (v_dm_channel_id, p_user2_id);

  RETURN v_dm_channel_id;
END; $$;

-- Insert default permissions
INSERT INTO permissions (id, name, description, category) VALUES
  ('manage_server', 'Управление сервером', 'Изменение настроек сервера', 'server'),
  ('manage_roles', 'Управление ролями', 'Создание и редактирование ролей', 'server'),
  ('manage_channels', 'Управление каналами', 'Создание и удаление каналов', 'channel'),
  ('kick_members', 'Выгонять участников', 'Удаление участников с сервера', 'member'),
  ('ban_members', 'Банить участников', 'Блокировка участников', 'member'),
  ('send_messages', 'Отправка сообщений', 'Право отправлять сообщения', 'message'),
  ('read_messages', 'Чтение сообщений', 'Право видеть сообщения', 'message'),
  ('manage_messages', 'Управление сообщениями', 'Удаление сообщений других', 'message'),
  ('embed_links', 'Встраивание ссылок', 'Право на превью ссылок', 'message'),
  ('attach_files', 'Прикрепление файлов', 'Загрузка файлов', 'message'),
  ('mention_everyone', 'Упоминание @everyone', 'Упоминание всех участников', 'message'),
  ('use_voice', 'Использование голосовых каналов', 'Подключение к голосовым каналам', 'voice'),
  ('speak', 'Говорить', 'Передача голоса в голосовых каналах', 'voice'),
  ('mute_members', 'Отключение микрофона', 'Отключение микрофона другим', 'voice'),
  ('deafen_members', 'Отключение звука', 'Отключение звука другим', 'voice'),
  ('move_members', 'Перемещение участников', 'Перемещение между голосовыми каналами', 'voice')
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX idx_categories_server_id ON categories(server_id);
CREATE INDEX idx_channels_server_id ON channels(server_id);
CREATE INDEX idx_channels_category_id ON channels(category_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_pinned_messages_message_id ON pinned_messages(message_id);
CREATE INDEX idx_pinned_messages_channel_id ON pinned_messages(channel_id);
CREATE INDEX idx_pinned_messages_pinned_by ON pinned_messages(pinned_by);
CREATE INDEX idx_file_attachments_message_id ON file_attachments(message_id);
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX idx_mentions_message_id ON mentions(message_id);
CREATE INDEX idx_mentions_mentioned_user_id ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_mentioned_by ON mentions(mentioned_by);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'message', 'friend_request', 'server_invite', 'system')),
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mentions BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  friend_requests BOOLEAN DEFAULT true,
  server_invites BOOLEAN DEFAULT true,
  system BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentions table
CREATE TABLE mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_roles_server_id ON roles(server_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_server_invites_server_id ON server_invites(server_id);
CREATE INDEX idx_server_invites_code ON server_invites(code);
CREATE INDEX idx_server_invites_created_by ON server_invites(created_by);
CREATE INDEX idx_server_bans_server_id ON server_bans(server_id);
CREATE INDEX idx_server_bans_user_id ON server_bans(user_id);
CREATE INDEX idx_server_bans_banned_by ON server_bans(banned_by);
CREATE INDEX idx_dm_channels_created_by ON dm_channels(created_by);
CREATE INDEX idx_dm_channel_members_dm_channel_id ON dm_channel_members(dm_channel_id);
CREATE INDEX idx_dm_channel_members_user_id ON dm_channel_members(user_id);
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);