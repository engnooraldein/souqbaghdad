const PAGE_TOKEN = "EAAPXexo3QZCcBSKNW6llxRSRe9bby554GJ8K8DJbX6L9RSeE0yJVpIKLCOAbqgJDoCSA1mZBxT2bnnulmvZBU10UWBoZAFZC4OVm1lTD8oz2k4XDwjGKaNg6BajQOk6h6eyQhz5dxjRlgj5mCjTlk0lh7yBvi0PIVKNqonS8zA2RZBctWc5I9dRgr5n4hZBZBZA8ybsDDSHWi";
const IG_ID = "17841403127032930";

function getInstagramSafeImageUrl(url) {
  if (!url) return null;
  if (url.includes('/storage/v1/object/public/')) {
    try {
       const urlObj = new URL(url);
       urlObj.searchParams.set('width', '1080');
       urlObj.searchParams.set('height', '1080');
       urlObj.searchParams.set('resize', 'cover');
       return urlObj.toString();
    } catch(e) {
       return url;
    }
  }
  return url;
}

async function testInstagramUpload() {
  const rawUrl = "https://lyhqnccpudwgvexqinxa.supabase.co/storage/v1/object/public/ads/sample_image.jpg"; // Using a dummy or the actual open graph image for test
  const testUrl = getInstagramSafeImageUrl("https://souqbaghdad.store/opengraph.jpg"); // Not a supabase url, won't be changed
  const sbUrl = getInstagramSafeImageUrl("https://lyhqnccpudwgvexqinxa.supabase.co/storage/v1/object/public/products/123/image.jpg"); 
  console.log("Safe URL:", sbUrl);

  const uploadUrl = `https://graph.facebook.com/v20.0/${IG_ID}/media`;
  const uploadBody = {
    image_url: "https://souqbaghdad.store/opengraph.jpg",
    caption: "تست مربع",
    access_token: PAGE_TOKEN
  };
  
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uploadBody)
  });
  const uploadData = await res.json();
  console.log("IG Upload Data:", uploadData);
}

testInstagramUpload();
