import { Context } from "grammy";
import { bot } from "..";

/**
 * Displays the "is typing..." animated indicator inside Telegram.
 * @param chatId ID of current chat.
 */
export const showBotActivity = async (ctx: Context, chatId: number) => {
  try {
    const topicId = ctx.msg?.message_thread_id;

    try {
      await bot.api.sendChatAction(chatId, "typing", {
        message_thread_id: topicId ?? undefined,
      });
    } catch (e) {
      console.error(`[Error-1] Could not display bot activity indicator.`);
      console.error(e);
      return;
    }
  } catch (error) {
    console.error(`[Error-2] Could not display bot activity indicator.`);
    return;
  }
};
