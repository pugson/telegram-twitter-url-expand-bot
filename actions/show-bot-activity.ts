import { Context } from "grammy";
import { bot } from "..";

/**
 * Displays the "is typing..." animated indicator inside Telegram.
 * @param chatId ID of current chat.
 */
export const showBotActivity = async (ctx: Context, chatId: number) => {
  const topicId = ctx.msg?.message_thread_id;

  try {
    bot.api.sendChatAction(chatId, "typing", {
      message_thread_id: topicId ?? undefined,
    });
  } catch (e) {
    console.error(`[Error-1] Could not display bot activity indicator.`);
    console.error(e);
    return;
  }

  return;
};
