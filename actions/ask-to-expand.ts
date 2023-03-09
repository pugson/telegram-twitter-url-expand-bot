import { bot } from "..";
import { isInstagram, isTikTok } from "../helpers/platforms";
import { askToExpandTemplate } from "../helpers/templates";

/**
 * Sends a reply in chat asking the user if they want to expand
 * links in the message with 2 buttons: Yes and No
 * @param chatId Telegram Chat ID
 * @param msgId Telegram Message ID
 * @param identifier Unique identifier for this message
 * @param link Link to expand
 * @param isDeletable Whether the original message can be deleted
 */
export const askToExpand = async (
  chatId: number,
  msgId: number,
  identifier: string,
  link: string,
  isDeletable: boolean
) => {
  const insta = isInstagram(link);
  const tiktok = isTikTok(link);
  const platform = insta ? "instagram" : tiktok ? "tiktok" : "twitter";

  await bot.api.sendMessage(chatId, askToExpandTemplate(link), {
    reply_to_message_id: msgId,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Yes",
            callback_data: `expand:yes:${identifier}:${platform}:${isDeletable}`,
            // callback_data has a 64 byte limit!!!
          },
          {
            text: "❌ No",
            callback_data: `expand:no:${identifier}:${platform}`,
          },
        ],
      ],
    },
  });
};
