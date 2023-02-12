import { bot } from "../..";
import { Context } from "grammy";
import { trackEvent } from "../../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";

bot.command("source", async (ctx: Context) => {
  if (!ctx.msg) return;

  const chatId = ctx?.msg?.chat.id;
  const msgId = ctx?.msg?.message_id;

  showBotActivity(chatId);
  deleteMessage(chatId, msgId);
  ctx.reply(`This bot’s source code is available on GitHub: https://github.com/pugson/telegram-twitter-url-expand-bot`);

  trackEvent("command.sourceCode");
});
