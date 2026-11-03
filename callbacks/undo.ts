import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { forgetExpanded, isRecentlyExpanded } from "../helpers/cache";
import { INSTAGRAM_DOMAINS, TIKTOK_DOMAINS, TWITTER_DOMAINS, FACEBOOK_DOMAINS } from "../helpers/platforms";
import { logger } from "../helpers/logger";
import { formattingEntities } from "../helpers/templates";

/**
 * Handle undo button for expanded links
 * Replaces expanded links back to their original form
 * @param ctx Telegram context
 */
export async function handleUndo(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) {
    logger.error("Missing data in undo callback: {chatId} {messageId} {data}", { chatId, messageId, data });
    return;
  }

  if (data.startsWith("undo:")) {
    // undo:authorId — the same author check as the Delete button
    const authorId = Number(data.split(":")[1]);
    if (answer.from.id !== authorId) {
      await ctx.answerCallbackQuery({
        text: "This link can only be undone by the person who sent it.",
        show_alert: true,
      });
      return;
    }

    try {
      // Ignore clicks on buttons left over from an old reply
      const replyKey = `${chatId}:${messageId}`;
      if (isRecentlyExpanded(replyKey)) {
        // Get the message text or caption
        const messageText = answer.message?.text ?? answer.message?.caption;
        if (!messageText) {
          logger.error("No message text in undo callback");
          return;
        }

        const escapeDomain = (domain: string) => domain.replace(/\./g, "\\.");

        const TWITTER_UNDO_DOMAINS = [...TWITTER_DOMAINS, "fxtwitter.com", "vxtwitter.com"];
        const INSTAGRAM_UNDO_DOMAINS = [...INSTAGRAM_DOMAINS];
        const TIKTOK_UNDO_DOMAINS = [...TIKTOK_DOMAINS];
        const FACEBOOK_UNDO_DOMAINS = [...FACEBOOK_DOMAINS];

        let platform: "twitter" | "instagram" | "tiktok" | "reddit" | "threads" | "youtube" | "facebook" | null = null;
        let undoText = messageText;

        // Determine platform and handle URL replacement
        const hasDomain = (domains: string[]) => domains.some((domain) => messageText.includes(domain));

        if (hasDomain(INSTAGRAM_UNDO_DOMAINS)) {
          platform = "instagram";
          INSTAGRAM_UNDO_DOMAINS.forEach((domain) => {
            undoText = undoText.replace(new RegExp(escapeDomain(domain), "g"), "instagram.com");
          });
        } else if (hasDomain(TWITTER_UNDO_DOMAINS)) {
          platform = "twitter";
          TWITTER_UNDO_DOMAINS.forEach((domain) => {
            undoText = undoText.replace(new RegExp(escapeDomain(domain), "g"), "twitter.com");
          });
        } else if (hasDomain(TIKTOK_UNDO_DOMAINS)) {
          platform = "tiktok";
          TIKTOK_UNDO_DOMAINS.forEach((domain) => {
            const domainRegex = new RegExp(`(?:vm\\.)?${escapeDomain(domain)}`, "g");
            undoText = undoText.replace(domainRegex, "tiktok.com");
          });
        } else if (messageText.includes("rxddit.com")) {
          platform = "reddit";
          undoText = messageText.replace(/rxddit\.com/g, "reddit.com");
        } else if (messageText.includes("threadsez.com")) {
          platform = "threads";
          undoText = messageText.replace(/threadsez\.com/g, "threads.com");
        } else if (messageText.includes("koutube.com/shorts/")) {
          platform = "youtube";
          undoText = messageText.replace(/koutube\.com\/shorts\//g, "youtube.com/shorts/");
        } else if (hasDomain(FACEBOOK_UNDO_DOMAINS)) {
          platform = "facebook";
          FACEBOOK_UNDO_DOMAINS.forEach((domain) => {
            undoText = undoText.replace(new RegExp(escapeDomain(domain), "g"), "facebook.com");
          });
        } else if (
          messageText.includes("instagram.com") ||
          messageText.includes("twitter.com") ||
          messageText.includes("tiktok.com") ||
          messageText.includes("reddit.com") ||
          messageText.includes("threads.com") ||
          messageText.includes("threads.net") ||
          messageText.includes("youtube.com/shorts/") ||
          messageText.includes("facebook.com")
        ) {
          // The message already contains original URLs - it was already undone
          await ctx.answerCallbackQuery({
            text: "✅ Link has already been reverted to the original",
            show_alert: false,
          });
          return;
        }

        if (!platform) {
          logger.error("Could not determine platform from message");
          return;
        }

        try {
          // Undo and "Embed not working?" no longer apply. Keep the Delete
          // countdown and Open button; the countdown carries on without them.
          forgetExpanded(replyKey);
          const keyboard = (answer.message?.reply_markup?.inline_keyboard ?? [])
            .map((row) => row.filter((button) => !("callback_data" in button && /^(undo|switch):/.test(button.callback_data))))
            .filter((row) => row.length > 0);

          // Edit the message to show the original URL
          await ctx.api.editMessageText(chatId, messageId, undoText, {
            entities: formattingEntities(answer.message?.entities),
            reply_markup: { inline_keyboard: keyboard },
          });
        } catch (editError) {
          const error = editError as Error;
          // Message not found errors are expected if message was deleted
          if (error.message.includes("message to edit not found")) {
            logger.warn("Cannot update buttons. Message was probably deleted");
          } else {
            logger.error("Failed to edit message: {error} {chatId} {messageId}", {
              error: error.message,
              chatId,
              messageId,
            });
          }
        }

        // Track the undo event
        trackEvent(`expand.undo.${platform}`);
      } else {
        // Message not in cache - the 35-second window has passed
        await ctx.answerCallbackQuery({
          text: "This action is no longer available (35s time limit after expanding)",
          show_alert: true,
        });
      }
    } catch (error) {
      logger.error("Cannot process undo: {error}", { error });
    }
  }
}
