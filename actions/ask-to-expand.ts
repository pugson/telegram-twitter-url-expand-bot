import { Context } from "grammy";
import { getPlatformKey, getTogglePlatformKey } from "../helpers/platforms";
import { isBanned } from "../helpers/banned";
import { askToExpandTemplate } from "../helpers/templates";
import { logger } from "../helpers/logger";

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
  if (!ctx || !ctx.chat?.id) return;

  const chatId = ctx.chat?.id;
  if (isBanned(chatId)) return;

  // Use the toggle key (instagram-share folds into instagram) to keep
  // callback_data short — it has a 64 byte limit.
  const platform = getTogglePlatformKey(link) ?? getPlatformKey(link);

  try {
    const originalReplyId = ctx.update?.message?.reply_to_message?.message_id;

    await ctx
      .reply(askToExpandTemplate(link), {
        reply_to_message_id: ctx.msg?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Yes",
                callback_data: `expand:yes:${identifier}:${platform}:${originalReplyId}:${isDeletable}`,
                // callback_data has a 64 byte limit!!!
              },
              {
                text: "❌ No",
                callback_data: `expand:no:${identifier}:${platform}`,
              },
            ],
          ],
        },
      })
      .catch((error) => {
        logger.error("Could not send ask-to-expand message: {error}", { error });
        return;
      });
  } catch (error) {
    logger.error("Error sending ask-to-expand message: {error}", { error });
    return;
  }
};
