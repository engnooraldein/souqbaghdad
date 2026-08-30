async function runScan() {
  const url = 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot?action=scan_bot';
  const res = await fetch(url);
  const data = await res.json();
  console.log('SCAN REPORT:', JSON.stringify(data, null, 2));
}

runScan();
