const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHFuY2NwdWR3Z3ZleHFpbnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA2Mjg3NiwiZXhwIjoyMDk2NjM4ODc2fQ.ifCYbYjFWTAheZhhCxKrS8FJDse3qNZ8B2FhVazkX6A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testCleanAuthRpc() {
  console.log("Calling clean_auth_dummy_emails rpc...");
  const { data, error } = await supabase.rpc('clean_auth_dummy_emails');
  console.log("RPC result:", data, "Error:", error);
}

testCleanAuthRpc();
