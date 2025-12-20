import { bot } from "..";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";
import { isBanned } from "../helpers/banned";
import { safeReply } from "../helpers/templates";
import { logger } from "../helpers/logger";

bot.command("source", async (ctx: Context) => {
  if (!ctx.msg) return;

  try {
    const chatId = ctx?.msg?.chat.id;
    const msgId = ctx?.msg?.message_id;
    const topicId = ctx.msg?.message_thread_id;

    if (isBanned(chatId)) return;

    showBotActivity(ctx, chatId);
    deleteMessage(chatId, msgId);

    await safeReply(
      ctx,
      `This bot’s source code is available here: https://github.com/pugson/telegram-twitter-url-expand-bot

For feature requests and bug reports please open an issue on GitHub.
    `,
      {
        message_thread_id: topicId ?? undefined,
      }
    );
  } catch (error) {
    logger.error("Cannot send source message: {error}", { error });
    return;
  }

  trackEvent("command.sourceCode");
});
