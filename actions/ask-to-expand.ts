import { bot } from "..";

export const askToExpand = async (msg: any, chatId: string, link: string, isInstagram: boolean) => {
  const platform = isInstagram ? "Instagram post" : "Tweet";

  bot.sendMessage(chatId, `Expand this ${platform}?`, {
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Yes",
            callback_data: link.replace("mobile.", ""),
            // callback_data has a 64 byte limit!!!
          },
          {
            text: "❌ No",
            callback_data: isInstagram ? "no.instagram" : "no.twitter",
          },
        ],
      ],
    },
  });
};
