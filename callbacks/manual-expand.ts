import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { deleteFromCache, getFromCache } from "../helpers/cache";

/**
 * Handle Yes/No button responses to expand links
 * @param ctx Telegram context
 */
export async function handleManualExpand(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("expand:no")) {
    const properties = data.split(":"); // expand:yes:chatId:messageId:platform
    const originalChatId = properties[2];
    const originalMessageId = properties[3];
    const platform = properties[4];
    const identifier = `${originalChatId}:${originalMessageId}`;

    await ctx.answerCallbackQuery();
    // Delete message with buttons
    // Wipe it from cache
    // Track the event
    deleteMessage(chatId, messageId);
    deleteFromCache(identifier);
    trackEvent(`expand.no.${platform}`);

    return;
  }

  if (data.includes("expand:yes")) {
    const properties = data.split(":"); // expand:yes:chatId:messageId:platform
    const originalChatId = properties[2];
    const originalMessageId = properties[3];
    const platform = properties[4];
    const identifier = `${originalChatId}:${originalMessageId}`;
    const messageFromCache: any = await getFromCache(identifier);

    if (messageFromCache) {
      // TODO: handle expand logic here
      // do it in another action because there's gonna be some settings checks
      deleteMessage(chatId, messageId); // with buttons
      deleteMessage(originalChatId, Number(originalMessageId));
      ctx.reply(messageFromCache.update.message.text);
      trackEvent(`expand.yes.${platform}`);
    }

    await ctx.answerCallbackQuery();

    return;
  }
}
