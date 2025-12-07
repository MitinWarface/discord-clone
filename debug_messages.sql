-- Debug script for messages loading error
-- Run this after clean_schema.sql to debug message loading issues

-- 1. Check if messages table exists and has data
DO $$
BEGIN
    RAISE NOTICE '=== Messages table info ===';
    RAISE NOTICE 'Total messages: %', (SELECT COUNT(*) FROM messages);
    RAISE NOTICE 'Sample messages: %', (SELECT array_agg(content) FROM (SELECT content FROM messages LIMIT 3) t);
END $$;

-- 2. Check if channels exist
DO $$
BEGIN
    RAISE NOTICE '=== Channels table info ===';
    RAISE NOTICE 'Total channels: %', (SELECT COUNT(*) FROM channels);
    RAISE NOTICE 'Sample channels: %', (SELECT array_agg(name) FROM (SELECT name FROM channels LIMIT 3) t);
END $$;

-- 3. Check if profiles exist for message authors
DO $$
BEGIN
    RAISE NOTICE '=== Profiles for message authors ===';
    RAISE NOTICE 'Profiles check: %', (SELECT COUNT(*) FROM messages m LEFT JOIN profiles p ON m.user_id = p.id);
END $$;

-- 4. Test the exact query used in the app
DO $$
DECLARE
    first_channel_id UUID;
    message_count INTEGER;
BEGIN
    RAISE NOTICE '=== Testing app query ===';

    SELECT id INTO first_channel_id FROM channels LIMIT 1;

    IF first_channel_id IS NOT NULL THEN
        SELECT COUNT(*) INTO message_count
        FROM messages m
        LEFT JOIN profiles p ON m.user_id = p.id
        WHERE m.channel_id = first_channel_id;

        RAISE NOTICE 'Messages in first channel (%): %', first_channel_id, message_count;
    ELSE
        RAISE NOTICE 'No channels found';
    END IF;
END $$;

-- 5. Check RLS status
DO $$
BEGIN
    RAISE NOTICE '=== RLS Status ===';
    RAISE NOTICE 'Messages RLS enabled: %', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'messages' AND schemaname = 'public');
END $$;

-- 6. Check current user and permissions
SELECT 'Current auth info:' as info;
-- This would need to be run with actual user context

-- 7. Test simple message insert
SELECT 'Testing message insert:' as info;
DO $$
DECLARE
    test_channel_id UUID;
    test_user_id UUID := '3c85c4a5-1b22-49ab-90b1-2a67b4f357fa';
BEGIN
    -- Get first available channel
    SELECT id INTO test_channel_id FROM channels LIMIT 1;

    IF test_channel_id IS NOT NULL THEN
        INSERT INTO messages (channel_id, user_id, content)
        VALUES (test_channel_id, test_user_id, 'Test message from debug script')
        RETURNING id, content;
    ELSE
        RAISE NOTICE 'No channels found for testing';
    END IF;
END $$;

-- 8. Check message count after insert
SELECT 'Message count after test insert:' as info;
SELECT COUNT(*) as messages_after_test FROM messages;