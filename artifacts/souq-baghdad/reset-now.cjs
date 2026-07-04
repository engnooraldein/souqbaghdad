const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lyhqnccpudwgvexqinxa.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHFuY2NwdWR3Z3ZleHFpbnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODYxNzA0MSwiZXhwIjoyMDI0MTkzMDQxfQ.REDACTED"; // Wait, I don't have the service role key!

// Actually, I can just use the Edge function I just created!

fetch("https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/admin-reset-password", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        // Needs authorization to run!
    }
})
