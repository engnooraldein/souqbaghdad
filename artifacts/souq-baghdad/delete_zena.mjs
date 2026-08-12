import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lyhqnccpudwgvexqinxa.supabase.co',
  'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
);

// We need the page access token to delete from Facebook
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || '';

async function solveZena() {
  const transId = 'af9ca106-5b08-4ede-903f-727fbfa3cdb5';
  
  // Try to delete from Facebook directly using the API
  const fbPostId = '1088044114402452_122119072173382636';
  console.log('Attempting to delete from FB:', fbPostId);
  
  if (META_PAGE_ACCESS_TOKEN) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${fbPostId}?access_token=${META_PAGE_ACCESS_TOKEN}`, {
        method: 'DELETE'
      });
      const text = await res.text();
      console.log('FB response:', res.status, text);
    } catch(e) {
      console.log('FB error:', e);
    }
  } else {
    console.log('No META_PAGE_ACCESS_TOKEN available in env, skipping FB delete. The webhook should handle it if we update the status.');
  }

  console.log('Done script.');
}

solveZena();
