const ref = 'lyhqnccpudwgvexqinxa';
const token = 'sb_secret_dbtLm9BK1rLW9Ggf_2ZVlA_CySkCPte';
fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: 'SELECT count(*) FROM ads;' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
