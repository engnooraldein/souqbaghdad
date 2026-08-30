async function check() {
  const token = '8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg';
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json());
  console.log('Bot getMe:', me);

  const hook = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(r => r.json());
  console.log('Bot getWebhookInfo:', hook);
}
check();
