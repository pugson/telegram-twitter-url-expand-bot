import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { deleteMessage } from "../actions/delete-message";
import { checkIfCached, deleteFromCache, getFromCache } from "../helpers/cache";
import { expandLink } from "../actions/expand-link";
import { showBotActivity } from "../actions/show-bot-activity";

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
    const originalChatId: string = properties[2];
    const originalMessageId: string = properties[3];
    const linkIndex: number = Number(properties[4]);
    const platform: string = properties[5];
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
    try {
      const properties = data.split(":"); // expand:yes:chatId:messageId:linkIndex:platform:isDeletable
      const originalChatId: string = properties[2];
      const originalMessageId: string = properties[3];
      const linkIndex: number = Number(properties[4]);
      const platform: string = properties[5];
      const isDeletable: boolean = properties[6] === "true";
      const identifier = `${originalChatId}:${originalMessageId}:${linkIndex}`;
      const prevLinkIdentifier = `${originalChatId}:${originalMessageId}:${linkIndex - 1}`;
      const nextLinkIdentifier = `${originalChatId}:${originalMessageId}:${linkIndex + 1}`;
      const hasPrevLink: boolean = await checkIfCached(prevLinkIdentifier);
      const hasNextLink: boolean = await checkIfCached(nextLinkIdentifier);
      const contextFromCache: any = await getFromCache(identifier);
      const cachedMessage = contextFromCache?.update?.message;
      const urlOffset: number =
        cachedMessage?.entities?.[linkIndex].offset || cachedMessage?.caption_entities?.[linkIndex].offset || 0;
      const urlLength: number =
        cachedMessage?.entities?.[linkIndex].length || cachedMessage?.caption_entities?.[linkIndex].length;
      const message = cachedMessage?.text ?? cachedMessage?.caption ?? "";
      const url: string = message.slice(urlOffset, urlOffset + urlLength);

      // Only expand when a message has been cached, otherwise ignore the callback
      // because it will throw an error when trying to delete the message.
      if (contextFromCache) {
        const entities = contextFromCache.entities() || contextFromCache.caption_entities();
        const messageWithNoLinks = entities.reduce(
          (msg: string, entity: { text: any }) => msg.replace(entity.text, ""),
          message
        );

        const userInfo = {
          username: cachedMessage.from?.username,
          firstName: cachedMessage.from?.first_name,
          lastName: cachedMessage.from?.last_name,
          userId: cachedMessage.from?.id,
        };

        showBotActivity(chatId);
        await expandLink(ctx, url, messageWithNoLinks, userInfo, "manual");
        deleteMessage(chatId, messageId); // bot’s [yes][no] message
        deleteFromCache(identifier);

        // When multiple links are in the message the bot will send a reply for each link.
        // Delete the original message only if it's the last link in the message.
        if (!hasPrevLink && !hasNextLink) {
          if (isDeletable) await deleteMessage(originalChatId, Number(originalMessageId), ctx);
        }
      }

      trackEvent(`expand.yes.${platform}`);
    } catch (error) {
      console.error(error);
    }

    await ctx.answerCallbackQuery();
    return;
  }
}
