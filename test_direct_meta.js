const PAGE_TOKEN = "EAAPXexo3QZCcBSKNW6llxRSRe9bby554GJ8K8DJbX6L9RSeE0yJVpIKLCOAbqgJDoCSA1mZBxT2bnnulmvZBU10UWBoZAFZC4OVm1lTD8oz2k4XDwjGKaNg6BajQOk6h6eyQhz5dxjRlgj5mCjTlk0lh7yBvi0PIVKNqonS8zA2RZBctWc5I9dRgr5n4hZBZBZA8ybsDDSHWi";
const PAGE_ID = "1088044114402452";
const IG_ID = "17841403127032930";

async function testFacebook() {
  const url = `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`;
  const body = { caption: "تست مباشر", url: "https://souqbaghdad.store/opengraph.jpg", access_token: PAGE_TOKEN };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  console.log("FB:", await res.json());
}

async function testInstagram() {
  const uploadUrl = `https://graph.facebook.com/v20.0/${IG_ID}/media`;
  const uploadBody = {
    image_url: "https://souqbaghdad.store/opengraph.jpg",
    caption: "تست مباشر",
    access_token: PAGE_TOKEN
  };
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uploadBody)
  });
  const uploadData = await res.json();
  console.log("IG Upload:", uploadData);
  
  if (uploadData.id) {
    const publishUrl = `https://graph.facebook.com/v20.0/${IG_ID}/media_publish`;
    const publishBody = {
      creation_id: uploadData.id,
      access_token: PAGE_TOKEN
    };
    const pubRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody)
    });
    console.log("IG Publish:", await pubRes.json());
  }
}

testFacebook();
testInstagram();
