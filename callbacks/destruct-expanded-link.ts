import { Context } from "grammy";
import { deleteMessage } from "../actions/delete-message";
import { trackEvent } from "../helpers/analytics";

/**
 * Handle responses to expanded link’s "❌ Delete" button
 * @param ctx Telegram context
 */
export async function handleExpandedLinkDestruction(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("destruct:")) {
    const destructData = data.split(":");
    const originalAuthorId = Number(destructData[1]);
    const expansionType = destructData[2];
    const answerGiverId = answer?.from?.id;

    if (answerGiverId !== originalAuthorId) {
      await ctx
        .answerCallbackQuery({
          text: "This message can only be deleted by its original author.",
          show_alert: true,
        })
        .catch(() => {
          console.error(`[Error] Cannot answer callback query.`);
          return;
        });

      trackEvent(`destruct.${expansionType}.not-author-alert`);
      return;
    }

    deleteMessage(chatId, messageId);
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    trackEvent(`destruct.${expansionType}.author`);
    return;
  }
}
