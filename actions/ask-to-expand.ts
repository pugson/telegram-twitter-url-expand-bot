import { Context } from "grammy";
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
export const askToExpand = async (ctx: Context, identifier: string, link: string, isDeletable: boolean) => {
  const insta = isInstagram(link);
  const tiktok = isTikTok(link);
  const platform = insta ? "instagram" : tiktok ? "tiktok" : "twitter";

  try {
    const topicId = ctx.msg?.message_thread_id;
    await ctx.reply(askToExpandTemplate(link), {
      message_thread_id: topicId ?? undefined,
      reply_to_message_id: ctx.msg?.message_id,
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
  } catch (error) {
    console.error({
      message: "Error sending ask-to-expand message",
      error,
    });
  }
};
