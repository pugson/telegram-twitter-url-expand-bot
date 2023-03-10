import { Context } from "grammy";
import { deleteMessage } from "../actions/delete-message";
import { updateSettings } from "../helpers/api";
import { trackEvent } from "../helpers/analytics";

/**
 * Handle button responses to /permissions
 * @param ctx Telegram context
 */
export async function handlePermissionsSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("permissions:done")) {
    await ctx.answerCallbackQuery();
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("permissions:disable-warning")) {
    await ctx.answerCallbackQuery();
    deleteMessage(chatId, messageId);
    updateSettings(chatId, "ignore_permissions_warning", true);
    trackEvent("settings.permissions.disable-warning");
    return;
  }
}
