-- =========================================
-- Discord Clone Database Setup
-- Полная настройка базы данных для Discord-клона
-- =========================================

-- Удаление существующих таблиц (для полной переинициализации)
DO $$
BEGIN
    -- Удаляем таблицы в правильном порядке (сначала зависимые)
    DROP TABLE IF EXISTS reactions CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS channels CASCADE;
    DROP TABLE IF EXISTS server_members CASCADE;
    DROP TABLE IF EXISTS servers CASCADE;
    DROP TABLE IF EXISTS user_quests CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS friends CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- Игнорируем ошибки, если таблицы не существуют
        NULL;
END $$;

-- Удаление существующих функций
DROP FUNCTION IF EXISTS generate_discriminator(TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_users(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_default_quests(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Удаление существующих триггеров (только если таблицы существуют)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
    DROP TRIGGER IF EXISTS update_user_quests_updated_at ON user_quests;
    DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
    DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
    DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
    DROP TRIGGER IF EXISTS update_reactions_updated_at ON reactions;
EXCEPTION
    WHEN OTHERS THEN
        -- Игнорируем ошибки
        NULL;
END $$;

-- Включение RLS (Row Level Security)
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret'; -- Только для админа

-- =========================================
-- 1. Таблица профилей пользователей
-- =========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL, -- Полный ник: Name#1234
  username_base TEXT NOT NULL, -- Базовое имя без дискриминатора
  discriminator INTEGER NOT NULL CHECK (discriminator >= 1 AND discriminator <= 9999), -- 4-значное число
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT DEFAULT '/default-avatar.png',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username_base, discriminator) -- Уникальная комбинация имени и дискриминатора
);

-- RLS для profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политика для триггера (service role может вставлять)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =========================================
-- 2. Таблица друзей
-- =========================================

CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- RLS для friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Политики для friends
CREATE POLICY "Users can view their friend relationships" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend relationships" ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =========================================
-- 3. Таблица товаров
-- =========================================

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT CHECK (category IN ('nitro', 'emoji', 'stickers', 'boosts')),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для products (все могут читать, только админы могут изменять)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active products" ON products
  FOR SELECT USING (is_active = TRUE);

-- =========================================
-- 4. Таблица заказов (для корзины)
-- =========================================

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- 5. Таблица элементов заказа
-- =========================================

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- =========================================
-- 6. Таблица заданий пользователей
-- =========================================

CREATE TABLE user_quests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_title TEXT NOT NULL,
  quest_description TEXT,
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для user_quests
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quests" ON user_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their quests" ON user_quests
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- 7. Таблица серверов
-- =========================================

CREATE TABLE servers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  icon_url TEXT,
  invite_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для servers
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view servers" ON servers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Server owners can manage their servers" ON servers
  FOR ALL USING (auth.uid() = owner_id);

-- =========================================
-- 8. Таблица участников серверов
-- =========================================

CREATE TABLE server_members (
  id SERIAL PRIMARY KEY,
  server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- =========================================
-- 9. Таблица каналов
-- =========================================

CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'voice')) DEFAULT 'text',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для channels
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики
DROP POLICY IF EXISTS "Server members can view channels" ON channels;
DROP POLICY IF EXISTS "Server admins can manage channels" ON channels;

CREATE POLICY "Server members can view channels" ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server admins can insert channels" ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Server admins can update channels" ON channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Server admins can delete channels" ON channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = channels.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('admin', 'owner')
    )
  );

-- =========================================
-- 10. Таблица сообщений
-- =========================================

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'system')) DEFAULT 'text',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      JOIN channels c ON c.server_id = sm.server_id
      WHERE c.id = messages.channel_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server members can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members sm
      JOIN channels c ON c.server_id = sm.server_id
      WHERE c.id = messages.channel_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- 11. Таблица реакций
-- =========================================

CREATE TABLE reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji) -- Один пользователь может поставить только одну реакцию одного типа на сообщение
);

-- RLS для reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server members can view reactions" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN server_members sm ON sm.server_id = (
        SELECT c.server_id FROM channels c WHERE c.id = m.channel_id
      )
      WHERE m.id = reactions.message_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server members can add reactions" ON reactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN server_members sm ON sm.server_id = (
        SELECT c.server_id FROM channels c WHERE c.id = m.channel_id
      )
      WHERE m.id = reactions.message_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS для server_members
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики
DROP POLICY IF EXISTS "Authenticated users can view server memberships" ON server_members;
DROP POLICY IF EXISTS "Users can join servers" ON server_members;
DROP POLICY IF EXISTS "Server members can view memberships" ON server_members;
DROP POLICY IF EXISTS "Server admins can manage members" ON server_members;

CREATE POLICY "Server members can view memberships" ON server_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join servers" ON server_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Server admins can manage members" ON server_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can leave servers" ON server_members
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =========================================

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_channels_server_id ON channels(server_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_emoji ON reactions(emoji);

-- =========================================
-- ТРИГГЕРЫ
-- =========================================

-- Триггер для автоматического создания профиля пользователя
-- Создает профиль только если username передан в meta данных
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_name TEXT;
  user_discriminator INTEGER;
  full_username TEXT;
  user_display_name TEXT;
BEGIN
  -- Проверяем, есть ли username в meta данных
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
    base_name := NEW.raw_user_meta_data->>'username';
    user_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', base_name);

    -- Генерируем уникальный дискриминатор
    user_discriminator := generate_discriminator(base_name);

    -- Создаем полный username
    full_username := base_name || '#' || lpad(user_discriminator::TEXT, 4, '0');

    -- Вставляем профиль
    INSERT INTO public.profiles (id, username, username_base, discriminator, display_name)
    VALUES (NEW.id, full_username, base_name, user_discriminator, user_display_name);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Не создаем fallback профиль, пусть приложение само обработает
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quests_updated_at
  BEFORE UPDATE ON user_quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =========================================

-- Тестовые товары
INSERT INTO products (name, description, price, category, image_url) VALUES
('Nitro Classic', 'Месячная подписка на Nitro с базовыми функциями', 4.99, 'nitro', '⚡'),
('Nitro Full', 'Полная подписка на Nitro со всеми функциями', 9.99, 'nitro', '💎'),
('Смайлики Pack', 'Набор веселых и ярких эмодзи', 2.99, 'emoji', '😀'),
('Космос Pack', 'Эмодзи космической тематики для астрономов', 3.99, 'emoji', '🚀'),
('Арт Стикеры', 'Креативные стикеры для художников', 1.99, 'stickers', '🎨'),
('Буст сервера', 'Увеличьте лимиты вашего сервера', 4.99, 'boosts', '🚀'),
('Музыка Pack', 'Эмодзи музыкальной тематики', 2.49, 'emoji', '🎵'),
('Игровые Стикеры', 'Стикеры для геймеров', 3.49, 'stickers', '🎮');

-- Тестовые профили пользователей (для поиска)
-- В реальном приложении пользователи создаются через auth
-- Раскомментируйте и замените на реальные user ID после создания пользователей:
-- INSERT INTO profiles (id, username, username_base, discriminator, display_name, avatar_url, xp, level) VALUES
-- ('real-user-id-1', 'user123#0001', 'user123', 1, 'User 123', '/default-avatar.png', 150, 2),
-- ('real-user-id-2', 'gamer_pro#0002', 'gamer_pro', 2, 'Gamer Pro', '/default-avatar.png', 300, 3);

-- Функция для создания тестовых заданий (вызывать после регистрации пользователя)
CREATE OR REPLACE FUNCTION create_default_quests(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_quests (user_id, quest_title, quest_description, total, reward_xp) VALUES
  (user_uuid, 'Пригласить друга', 'Пригласите 1 друга в Discord', 1, 50),
  (user_uuid, 'Отправить сообщение', 'Отправьте 10 сообщений', 10, 25),
  (user_uuid, 'Присоединиться к серверу', 'Присоединитесь к 3 серверам', 3, 30),
  (user_uuid, 'Добавить реакцию', 'Добавьте 5 реакций на сообщения', 5, 15),
  (user_uuid, 'Создать сервер', 'Создайте свой первый сервер', 1, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
-- =========================================

-- Функция для генерации уникального дискриминатора
CREATE OR REPLACE FUNCTION generate_discriminator(base_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  discriminator INTEGER;
BEGIN
  -- Пытаемся найти свободный дискриминатор
  SELECT MIN(d) INTO discriminator
  FROM generate_series(1, 9999) AS d
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE username_base = base_name AND profiles.discriminator = d
  );

  -- Если все заняты, возвращаем случайный (хотя маловероятно)
  IF discriminator IS NULL THEN
    discriminator := floor(random() * 9999 + 1)::INTEGER;
  END IF;

  RETURN discriminator;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для поиска пользователей
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url
  FROM profiles p
  WHERE
    p.username ILIKE '%' || search_term || '%' OR
    p.username_base ILIKE '%' || search_term || '%' OR
    p.display_name ILIKE '%' || search_term || '%'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  friends_count BIGINT,
  quests_completed BIGINT,
  total_xp BIGINT,
  current_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT CASE WHEN f.status = 'accepted' THEN f.friend_id END) as friends_count,
    COUNT(DISTINCT CASE WHEN uq.completed THEN uq.id END) as quests_completed,
    COALESCE(p.xp, 0) as total_xp,
    COALESCE(p.level, 1) as current_level
  FROM profiles p
  LEFT JOIN friends f ON (f.user_id = user_uuid OR f.friend_id = user_uuid) AND f.status = 'accepted'
  LEFT JOIN user_quests uq ON uq.user_id = user_uuid AND uq.completed = TRUE
  WHERE p.id = user_uuid
  GROUP BY p.xp, p.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- ЗАВЕРШЕНИЕ НАСТРОЙКИ
-- =========================================

-- Установка прав для анонимных пользователей (для чтения публичных данных)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON servers TO anon;

-- Установка прав для аутентифицированных пользователей
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON friends TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON user_quests TO authenticated;
GRANT ALL ON servers TO authenticated;
GRANT ALL ON server_members TO authenticated;
GRANT ALL ON channels TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON reactions TO authenticated;

-- Sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =========================================
-- ПРОВЕРКА НАСТРОЙКИ
-- =========================================

-- Проверьте, что все таблицы созданы:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Проверьте RLS:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Тестовые запросы:
-- SELECT * FROM products WHERE is_active = true;
-- SELECT * FROM search_users('user123');
-- SELECT username, username_base, discriminator FROM profiles LIMIT 5;
-- SELECT generate_discriminator('testuser');
-- SELECT * FROM reactions LIMIT 5;

COMMIT;

COMMIT;