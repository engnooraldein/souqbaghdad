const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aHFuY2NwdWR3Z3ZleHFpbnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA2Mjg3NiwiZXhwIjoyMDk2NjM4ODc2fQ.ifCYbYjFWTAheZhhCxKrS8FJDse3qNZ8B2FhVazkX6A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

function toE164(phone) {
  if (!phone) return null;
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('964')) return '+' + digits;
  if (digits.startsWith('07')) return '+964' + digits.substring(1);
  if (digits.startsWith('7')) return '+964' + digits;
  if (digits.startsWith('00962')) return '+' + digits.substring(2);
  return '+' + digits;
}

async function syncAllProfilesWithAuth() {
  console.log("=== Syncing public.profiles and auth.users ===");
  
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUsers = authData.users;

  const { data: profiles } = await supabase.from('profiles').select('*');

  console.log(`Auth users count: ${authUsers.length}, Profiles count: ${profiles.length}`);

  let syncedCount = 0;

  for (const au of authUsers) {
    const isDummyEmail = au.email && (au.email.includes('@souqbaghdad.com') || au.email.includes('@souqbaghdad.store'));
    const realEmail = isDummyEmail ? null : au.email;
    const auPhone = au.phone || au.user_metadata?.phone || '';

    // Find matching profile by ID
    let prof = profiles.find(p => p.id === au.id);
    if (!prof && auPhone) {
      prof = profiles.find(p => p.phone === auPhone || (p.phone && toE164(p.phone) === toE164(auPhone)));
    }

    if (prof) {
      const finalPhone = prof.phone || auPhone || '';
      const finalName = prof.full_name || au.user_metadata?.full_name || au.user_metadata?.name || 'مستخدم';
      const finalEmail = (prof.email && !prof.email.includes('@souqbaghdad.com')) ? prof.email : realEmail;

      // Update public.profiles
      await supabase.from('profiles').update({
        full_name: finalName,
        phone: finalPhone,
        email: finalEmail || null
      }).eq('id', prof.id);

      // Update auth.users metadata & phone
      const authUpdates = {
        user_metadata: {
          ...(au.user_metadata || {}),
          full_name: finalName,
          phone: finalPhone
        }
      };
      if (finalPhone) {
        const e164 = toE164(finalPhone);
        if (e164) {
          authUpdates.phone = e164;
          authUpdates.phone_confirm = true;
        }
      }

      await supabase.auth.admin.updateUserById(au.id, authUpdates).catch(() => {});
      syncedCount++;
    }
  }

  console.log(`Successfully synced ${syncedCount} profiles.`);

  // Cleanup scratch test files
  const fs = require('fs');
  try { fs.unlinkSync('scratch_test_profile_update.cjs'); } catch (e) {}
}

syncAllProfilesWithAuth();
