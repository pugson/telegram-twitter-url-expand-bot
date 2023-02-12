import { bot } from "../..";
import { Context } from "grammy";
import { trackEvent } from "../../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";
import { permissionToDeleteMessageTemplate } from "../../helpers/templates";

// TODO: Check if bot is admin in chat before auto-deleting a message
// https://core.telegram.org/bots/api#getmydefaultadministratorrights
bot.command("admin", async (ctx: Context) => {
  if (!ctx.msg) return;

  const chatId = ctx?.msg?.chat.id;
  const msgId = ctx?.msg?.message_id;

  showBotActivity(chatId);
  deleteMessage(chatId, msgId);
  ctx.reply(permissionToDeleteMessageTemplate);

  trackEvent("command.admin");
});
