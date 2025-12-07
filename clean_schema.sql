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
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

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

-- Temporarily disable RLS for messages to debug
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
CREATE POLICY "Server members can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM channels c JOIN server_members sm ON sm.server_id = c.server_id WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reactions are viewable by server members" ON reactions FOR SELECT USING (EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = reactions.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Server members can insert reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM messages m JOIN channels c ON c.id = m.channel_id JOIN server_members sm ON sm.server_id = c.server_id WHERE m.id = reactions.message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

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

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER create_default_roles_trigger AFTER INSERT ON servers FOR EACH ROW EXECUTE FUNCTION create_default_roles();

-- Permissions function
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, server_id UUID, permission_id TEXT) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_permissions BIGINT := 0; role_record RECORD;
BEGIN
  -- Check if user is server owner
  IF EXISTS (SELECT 1 FROM servers WHERE id = server_id AND owner_id = user_id) THEN RETURN TRUE; END IF;
  FOR role_record IN SELECT r.permissions FROM server_members sm JOIN roles r ON r.id = sm.role_id WHERE sm.server_id = server_id AND sm.user_id = user_id LOOP user_permissions := user_permissions | role_record.permissions; END LOOP;
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
CREATE INDEX idx_roles_server_id ON roles(server_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);