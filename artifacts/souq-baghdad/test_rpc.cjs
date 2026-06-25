const https = require('https');
https.get('https://www.souqbaghdad.store/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if(match) {
      https.get('https://www.souqbaghdad.store' + match[1], (res2) => {
        let jsData = '';
        res2.on('data', chunk => jsData += chunk);
        res2.on('end', () => {
          console.log("HAS_RPC:", jsData.includes("admin_delete_user"));
        });
      });
    } else {
      console.log('No js file found');
    }
  });
});
