-- SQL скрипт для полного удаления базы данных Discord Clone
-- ВНИМАНИЕ: Этот скрипт удалит все данные без возможности восстановления!

DO $$
BEGIN
    -- Удаляем таблицы (с CASCADE для автоматического удаления политик, триггеров и индексов)
    -- Порядок важен: сначала зависимые таблицы, затем основные
    DROP TABLE IF EXISTS reactions CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS channels CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS server_members CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS servers CASCADE;
    DROP TABLE IF EXISTS friends CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;

    -- Удаляем функции (до таблиц, чтобы избежать зависимостей)
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP FUNCTION IF EXISTS create_default_roles();
    DROP FUNCTION IF EXISTS create_server_with_template(TEXT, UUID, TEXT);
    DROP FUNCTION IF EXISTS has_permission(UUID, UUID, TEXT);
    DROP FUNCTION IF EXISTS search_users(TEXT);

    -- Примечание: триггеры и индексы удалятся автоматически с таблицами при CASCADE

    -- Удаляем расширения (если они были созданы)
    DROP EXTENSION IF EXISTS "uuid-ossp";

    RAISE NOTICE 'База данных Discord Clone успешно удалена!';
END $$;