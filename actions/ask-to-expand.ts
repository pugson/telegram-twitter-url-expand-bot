import { bot } from "..";
import { isInstagram, isTikTok } from "../helpers/platforms";
import { manuallyExpandMessageTemplate } from "../helpers/templates";

export const askToExpand = async (msg: any, chatId: string, link: string) => {
  const insta = isInstagram(link);
  const tiktok = isTikTok(link);
  const platform = insta ? "instagram" : tiktok ? "tiktok" : "twitter";

  await bot.api.sendMessage(chatId, manuallyExpandMessageTemplate(link), {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Yes",
            callback_data: link.replace("mobile.", "").replace("https://www.", "").replace("https://", ""),
            // callback_data has a 64 byte limit!!!
            // `mobile.` needs to be stripped because it adds an extra 7 bytes
            // `https://www.` needs to be stripped because it adds an extra 12 bytes
            // for no real benefit, because the link will still work without it
          },
          {
            text: "❌ No",
            callback_data: `no.${platform}`,
          },
        ],
      ],
    },
  });
};
