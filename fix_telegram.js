const fs = require('fs');
const path = 'c:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts';
let f = fs.readFileSync(path, 'utf8');

// 1. Add EXTRA_CHANNEL
if (!f.includes("const EXTRA_CHANNEL = '@souqbaghdad_iq';")) {
  f = f.replace(/const TRANSPORT_CHANNEL = Deno\.env\.get\('TRANSPORT_CHANNEL_ID'\) \|\| '';/g, 
  "const TRANSPORT_CHANNEL = Deno.env.get('TRANSPORT_CHANNEL_ID') || '';\nconst EXTRA_CHANNEL = '@souqbaghdad_iq';");
}

// 2. Broaden the button message and post to EXTRA_CHANNEL for products
const productRegex = /if \((imagesToPost\.length > 1)\) \{\s*await sendMediaGroup\(PRODUCT_CHANNEL, imagesToPost, caption\);\s*res = await sendMessage\(PRODUCT_CHANNEL, 'للتواصل وعرض التفاصيل:', replyMarkup\);\s*\}/g;
const newProductFlow = `if (imagesToPost.length > 1) {
              await sendMediaGroup(PRODUCT_CHANNEL, imagesToPost, caption);
              res = await sendMessage(PRODUCT_CHANNEL, 'للتواصل وعرض التفاصيل يرجى استخدام الأزرار أدناه 👇', replyMarkup);
              if (EXTRA_CHANNEL) {
                await sendMediaGroup(EXTRA_CHANNEL, imagesToPost, caption);
                await sendMessage(EXTRA_CHANNEL, 'للتواصل وعرض التفاصيل يرجى استخدام الأزرار أدناه 👇', replyMarkup);
              }
            }`;

f = f.replace(productRegex, newProductFlow);

// 3. And for imagesToPost.length === 1 or 0, also broadcast to EXTRA_CHANNEL
const productRegexSingle = /\} else if \(imagesToPost\.length === 1\) \{\s*res = await sendPhoto\(PRODUCT_CHANNEL, imagesToPost\[0\], caption, replyMarkup\);\s*\} else \{\s*res = await sendMessage\(PRODUCT_CHANNEL, caption, replyMarkup\);\s*\}/g;
const newProductFlowSingle = `} else if (imagesToPost.length === 1) {
              res = await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, replyMarkup);
              if (EXTRA_CHANNEL) await sendPhoto(EXTRA_CHANNEL, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(PRODUCT_CHANNEL, caption, replyMarkup);
              if (EXTRA_CHANNEL) await sendMessage(EXTRA_CHANNEL, caption, replyMarkup);
            }`;

f = f.replace(productRegexSingle, newProductFlowSingle);

// 4. Same for record.post_channel which is used in the other block (lines 520+)
const recordChannelRegexMulti = /if \(imagesToPost\.length > 1\) \{\s*await sendMediaGroup\(record\.post_channel, imagesToPost, telegramCaption\);\s*res = await sendMessage\(record\.post_channel, 'للتواصل وعرض التفاصيل:', keyboard\);\s*\}/g;
const newRecordChannelMulti = `if (imagesToPost.length > 1) {
                await sendMediaGroup(record.post_channel, imagesToPost, telegramCaption);
                res = await sendMessage(record.post_channel, 'للتواصل وعرض التفاصيل يرجى استخدام الأزرار أدناه 👇', keyboard);
                if (EXTRA_CHANNEL) {
                   await sendMediaGroup(EXTRA_CHANNEL, imagesToPost, telegramCaption);
                   await sendMessage(EXTRA_CHANNEL, 'للتواصل وعرض التفاصيل يرجى استخدام الأزرار أدناه 👇', keyboard);
                }
              }`;
f = f.replace(recordChannelRegexMulti, newRecordChannelMulti);

const recordChannelRegexSingle = /\} else if \(imagesToPost\.length === 1\) \{\s*res = await sendPhoto\(record\.post_channel, imagesToPost\[0\], telegramCaption, keyboard\);\s*\} else \{\s*res = await sendMessage\(record\.post_channel, telegramCaption, keyboard\);\s*\}/g;
const newRecordChannelSingle = `} else if (imagesToPost.length === 1) {
                res = await sendPhoto(record.post_channel, imagesToPost[0], telegramCaption, keyboard);
                if (EXTRA_CHANNEL) await sendPhoto(EXTRA_CHANNEL, imagesToPost[0], telegramCaption, keyboard);
              } else {
                res = await sendMessage(record.post_channel, telegramCaption, keyboard);
                if (EXTRA_CHANNEL) await sendMessage(EXTRA_CHANNEL, telegramCaption, keyboard);
              }`;
f = f.replace(recordChannelRegexSingle, newRecordChannelSingle);

fs.writeFileSync(path, f, 'utf8');
