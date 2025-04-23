import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { peekFromCache } from "../helpers/cache";
import { getButtonState } from "../helpers/button-states";

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
    console.error("[Error] Missing data in undo callback", { chatId, messageId, data });
    return;
  }

  if (data === "undo") {
    try {
      const identifier = `${chatId}:${messageId}`;

      // Check if message is still in cache (within 35 second window)
      const cached = await peekFromCache(identifier);
      if (cached) {
        // Get the message text
        const messageText = answer.message?.text;
        if (!messageText) {
          console.error("[Error] No message text in undo callback");
          return;
        }

        let platform: "twitter" | "instagram" | "tiktok" | "reddit" | null = null;
        let undoText = messageText;

        // Determine platform and handle URL replacement
        if (messageText.includes("kkinstagram.com")) {
          platform = "instagram";
          undoText = messageText.replace(/kkinstagram\.com/g, "instagram.com");
        } else if (messageText.includes("fxtwitter.com")) {
          platform = "twitter";
          undoText = messageText.replace(/fxtwitter\.com/g, "twitter.com");
        } else if (messageText.includes("tfxktok.com")) {
          platform = "tiktok";
          undoText = messageText.replace(/tfxktok\.com/g, "tiktok.com");
        } else if (messageText.includes("rxddit.com")) {
          platform = "reddit";
          undoText = messageText.replace(/rxddit\.com/g, "reddit.com");
        } else if (
          messageText.includes("instagram.com") ||
          messageText.includes("twitter.com") ||
          messageText.includes("tiktok.com") ||
          messageText.includes("reddit.com")
        ) {
          // The message already contains original URLs - it was already undone
          await ctx.answerCallbackQuery({
            text: "✅ Link has already been reverted to the original",
            show_alert: false,
          });
          return;
        }

        if (!platform) {
          console.error("[Error] Could not determine platform from message.");
          return;
        }

        try {
          // Extract URL from the message text
          const urlMatch = undoText.match(/(https?:\/\/[^\s]+)/);
          const url = urlMatch ? urlMatch[1] : "";

          // Edit the message to show the original URL
          await ctx.api.editMessageText(chatId, messageId, undoText, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: getButtonState(platform as any, 15, ctx.from?.id || 0, url).buttons,
            },
          });
        } catch (editError) {
          const error = editError as Error;
          // Message not found errors are expected if message was deleted
          if (error.message.includes("message to edit not found")) {
            console.warn("[Warning] Cannot update buttons. Message was probably deleted.");
          } else {
            console.error("[Error] Failed to edit message:", {
              error: error.message,
              parameters: {
                chatId,
                messageId,
                undoText,
              },
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
      console.error("[Error] Cannot process undo", error);
    }
  }

  // Answer the callback query to remove the loading state
  await ctx.answerCallbackQuery().catch(() => {
    console.error("[Error] Cannot answer undo callback query.");
  });
}
