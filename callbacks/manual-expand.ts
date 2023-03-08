import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { checkIfCached, deleteFromCache, getFromCache } from "../helpers/cache";

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
    const properties = data.split(":"); // expand:yes:chatId:messageId:linkIndex:platform
    const originalChatId = properties[2];
    const originalMessageId = properties[3];
    const linkIndex = Number(properties[4]);
    const platform = properties[5];
    const identifier = `${originalChatId}:${originalMessageId}:${linkIndex}`;

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
    const properties = data.split(":"); // expand:yes:chatId:messageId:linkIndex:platform
    const originalChatId = properties[2];
    const originalMessageId = properties[3];
    const linkIndex = Number(properties[4]);
    const platform = properties[5];
    const identifier = `${originalChatId}:${originalMessageId}:${linkIndex}`;
    const prevLinkIdentifier = `${originalChatId}:${originalMessageId}:${linkIndex - 1}`;
    const nextLinkIdentifier = `${originalChatId}:${originalMessageId}:${linkIndex + 1}`;
    const hasPrevLink: boolean = await checkIfCached(prevLinkIdentifier);
    const hasNextLink: boolean = await checkIfCached(nextLinkIdentifier);
    const messageFromCache: any = await getFromCache(identifier);

    if (messageFromCache) {
      // TODO: handle expand logic here
      // do it in another action because there's gonna be some settings checks
      deleteMessage(chatId, messageId); // with buttons

      // When multiple links are in the message the bot will send a reply for each link.
      // Delete the original message only if it's the last link in the message.
      if (!hasPrevLink && !hasNextLink) {
        try {
          // Gotta await try/catch this because the original message might have been deleted already
          // and the bot will crash if it tries to delete a message that does not exist.
          await deleteMessage(originalChatId, Number(originalMessageId));
        } catch (error) {
          console.error(error);
        }
      }

      // TODO: temp reply
      ctx.reply(messageFromCache.update.message.text); // reduce to only include the right link index
      trackEvent(`expand.yes.${platform}`);
    }

    await ctx.answerCallbackQuery();

    return;
  }
}
