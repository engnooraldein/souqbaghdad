const token = "EAAPXexo3QZCcBSCv9ROyWD8dzK0yJojinLdhOztsjkZB3kGJPxkFj20Yh931WiItzNtbesDLt9ehL1YvM7oS9nvT55u4iDyGcealeCUDrEtgM9Mz7epF7ytB6xpgPQAYPjeOZBBr8Uvkt9ynf6wFZC9tk5lcQ0PrrXRMP6hXxoswW5n6ZCIvg7qkcZBIDhydCHsAZDZD";

async function checkToken() {
  const res = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${token}&access_token=${token}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

checkToken();
