const fs = require('fs');
const path = 'c:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts';
let f = fs.readFileSync(path, 'utf8');

// The product broadcast section starts roughly:
// if (publishTg) {
//   if (photoUrl) {
//     await sendPhoto(record.post_channel, photoUrl, telegramCaption, keyboard);
//   } else {
//     await sendMessage(record.post_channel, telegramCaption, keyboard);
//   }
// }

const oldProductFlow = `            if (publishTg) {
              if (photoUrl) {
                await sendPhoto(record.post_channel, photoUrl, telegramCaption, keyboard);
              } else {
                await sendMessage(record.post_channel, telegramCaption, keyboard);
              }
            }`;
const newProductFlow = `            if (publishTg) {
              const imagesToPost = record.images && record.images.length > 0 ? record.images : (photoUrl ? [photoUrl] : []);
              if (imagesToPost.length > 1) {
                await sendMediaGroup(record.post_channel, imagesToPost, telegramCaption);
                await sendMessage(record.post_channel, 'للتواصل وعرض التفاصيل:', keyboard);
              } else if (imagesToPost.length === 1) {
                await sendPhoto(record.post_channel, imagesToPost[0], telegramCaption, keyboard);
              } else {
                await sendMessage(record.post_channel, telegramCaption, keyboard);
              }
            }`;

if (f.includes(oldProductFlow)) {
  f = f.replace(oldProductFlow, newProductFlow);
} else {
  console.log("Could not find oldProductFlow");
}

const oldAdFlow = `            if (publishTg) {
              if (photoUrl) {
                await sendPhoto(PRODUCT_CHANNEL, photoUrl, caption, keyboard);
              } else {
                await sendMessage(PRODUCT_CHANNEL, caption, keyboard);
              }
            }`;
const newAdFlow = `            if (publishTg) {
              const imagesToPost = record.images && record.images.length > 0 ? record.images : (photoUrl ? [photoUrl] : []);
              if (imagesToPost.length > 1) {
                await sendMediaGroup(PRODUCT_CHANNEL, imagesToPost, caption);
                await sendMessage(PRODUCT_CHANNEL, 'للتواصل وعرض التفاصيل:', keyboard);
              } else if (imagesToPost.length === 1) {
                await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, keyboard);
              } else {
                await sendMessage(PRODUCT_CHANNEL, caption, keyboard);
              }
            }`;
if (f.includes(oldAdFlow)) {
  f = f.replace(oldAdFlow, newAdFlow);
} else {
  console.log("Could not find oldAdFlow");
}

fs.writeFileSync(path, f, 'utf8');
console.log('Script completed');
