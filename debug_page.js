const token = "EAAPXexo3QZCcBSCv9ROyWD8dzK0yJojinLdhOztsjkZB3kGJPxkFj20Yh931WiItzNtbesDLt9ehL1YvM7oS9nvT55u4iDyGcealeCUDrEtgM9Mz7epF7ytB6xpgPQAYPjeOZBBr8Uvkt9ynf6wFZC9tk5lcQ0PrrXRMP6hXxoswW5n6ZCIvg7qkcZBIDhydCHsAZDZD";

async function checkPages() {
  const res = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`);
  const data = await res.json();
  console.log("Pages:", JSON.stringify(data, null, 2));
  
  if (data.data && data.data.length > 0) {
    const pageId = data.data[0].id;
    const pageToken = data.data[0].access_token;
    
    // Check Instagram
    const igRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
    const igData = await igRes.json();
    console.log("IG Account:", JSON.stringify(igData, null, 2));
  }
}

checkPages();
