const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHFuY2NwdWR3Z3ZleHFpbnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODMwNDEwNiwiZXhwIjoyMDUzODgwMTA2fQ.y44oJ66Zf7g8pU2O190G7sWj67-428p0Z7033N879P8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addUniquePhoneConstraint() {
  console.log("To fully enforce UNIQUE phone constraint at the DB level, please run this SQL in Supabase SQL Editor:");
  console.log("ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);");
  console.log("Application-level checks are already implemented in AuthModal.tsx and ProfileView.tsx");
}

addUniquePhoneConstraint();
