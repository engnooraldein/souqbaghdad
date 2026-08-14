const PAGE_TOKEN = "EAAPXexo3QZCcBSKNW6llxRSRe9bby554GJ8K8DJbX6L9RSeE0yJVpIKLCOAbqgJDoCSA1mZBxT2bnnulmvZBU10UWBoZAFZC4OVm1lTD8oz2k4XDwjGKaNg6BajQOk6h6eyQhz5dxjRlgj5mCjTlk0lh7yBvi0PIVKNqonS8zA2RZBctWc5I9dRgr5n4hZBZBZA8ybsDDSHWi";

async function deletePosts() {
  const fbPostId = "1088044114402452_122119506561382636";
  const igPostId = "18172359070431482"; // Need to use IG Graph API for deleting, usually DELETE /v20.0/{ig_media_id}

  try {
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${fbPostId}?access_token=${PAGE_TOKEN}`, { method: 'DELETE' });
    console.log("FB Delete:", await fbRes.json());
  } catch (e) { console.log(e); }

  try {
    const igRes = await fetch(`https://graph.facebook.com/v20.0/${igPostId}?access_token=${PAGE_TOKEN}`, { method: 'DELETE' });
    console.log("IG Delete:", await igRes.json());
  } catch (e) { console.log(e); }
}

deletePosts();
