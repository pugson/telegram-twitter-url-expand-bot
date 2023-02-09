import { bot } from "..";
import { trackEvent } from "../helpers/analytics";
import { isInstagram } from "../helpers/platforms";

export const expandLink = (url: string, chatId: string, msgId: number) => {
  const instagram = isInstagram(url);
  // TODO: if autoexpand is enabled, do not include undo option and don’t reply to a deleted message
  // reply_to_message_id: null ??
  bot.editMessageText(url, {
    chat_id: chatId,
    message_id: msgId,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "↩️ Undo",
            callback_data: instagram ? "undo.instagram" : "undo.twitter",
            // callback_data has a 64 byte limit!!!
          },
        ],
      ],
    },
  });

  trackEvent(instagram ? "instagram.link.expand" : "twitter.link.expand");
};
