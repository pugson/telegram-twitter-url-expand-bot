import { bot } from "..";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { showBotActivity } from "../actions/show-bot-activity";
import { handleMissingPermissions } from "../actions/missing-permissions";

bot.command("permissions", async (ctx: Context) => {
  if (!ctx.msg) return;

  const chatId = ctx?.msg?.chat.id;
  const msgId = ctx?.msg?.message_id;

  showBotActivity(chatId);
  deleteMessage(chatId, msgId);
  handleMissingPermissions(ctx, true);

  trackEvent("command.permissions");
});
