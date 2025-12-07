-- Debug script to test server creation
-- Run this after clean_schema.sql to test if functions work

-- Test 1: Check if we can create a server directly
DO $$
DECLARE
  test_server_id UUID;
BEGIN
  RAISE NOTICE 'Testing direct server creation...';

  INSERT INTO servers (name, owner_id)
  VALUES ('Test Server', '3c85c4a5-1b22-49ab-90b1-2a67b4f357fa')
  RETURNING id INTO test_server_id;

  RAISE NOTICE 'Server created with ID: %', test_server_id;

  -- Check if roles were created by trigger
  RAISE NOTICE 'Checking roles...';
  PERFORM * FROM roles WHERE server_id = test_server_id;

  -- Check if member was added
  RAISE NOTICE 'Checking members...';
  PERFORM * FROM server_members WHERE server_id = test_server_id;

  -- Check categories and channels
  RAISE NOTICE 'Checking categories and channels...';
  PERFORM * FROM categories WHERE server_id = test_server_id;
  PERFORM * FROM channels WHERE server_id = test_server_id;

  RAISE NOTICE 'Direct creation test completed successfully!';
END $$;

-- Test 2: Test the RPC function
SELECT create_server_with_template('RPC Test Server', '3c85c4a5-1b22-49ab-90b1-2a67b4f357fa', 'gaming_friends') as rpc_result;