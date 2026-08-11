const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://lyhqnccpudwgvexqinxa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHFuY2NwdWR3Z3ZleHFpbnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA2Mjg3NiwiZXhwIjoyMDk2NjM4ODc2fQ.ifCYbYjFWTAheZhhCxKrS8FJDse3qNZ8B2FhVazkX6A'
);
async function run() {
  const sql = `
    DROP POLICY IF EXISTS "Admins can delete ads" ON public.ads;
    CREATE POLICY "Admins can delete ads"
    ON public.ads FOR DELETE
    TO authenticated
    USING (
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'owner')
    );
  `;
  const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
  console.log('Result:', error || 'Success');
}
run();
