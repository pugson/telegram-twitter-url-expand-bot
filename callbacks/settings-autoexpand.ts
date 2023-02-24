import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { updateSettings } from "../helpers/api";
import { autoexpandMessageTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { handleMissingPermissions } from "../actions/missing-permissions";

const FIELD_NAME = "autoexpand";

/**
 * Handle button responses to /autoexpand
 * @param ctx Telegram context
 */
export async function handleAutoexpandSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;
  const privateChat = answer?.message?.chat.type === "private";

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("autoexpand:done")) {
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("autoexpand:off")) {
    updateSettings(chatId, FIELD_NAME, false);
    await ctx.api.editMessageText(chatId, messageId, autoexpandMessageTemplate(false), {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Enable",
              callback_data: `autoexpand:on`,
            },
            {
              text: "✨ Done",
              callback_data: "autoexpand:done",
            },
          ],
        ],
      },
    });

    trackEvent("settings.autoexpand.disable");

    return;
  }

  if (data.includes("autoexpand:on")) {
    updateSettings(chatId, FIELD_NAME, true);
    await ctx.api.editMessageText(chatId, messageId, autoexpandMessageTemplate(true), {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "❌ Disable",
              callback_data: `autoexpand:off`,
            },
            {
              text: "✨ Done",
              callback_data: "autoexpand:done",
            },
          ],
        ],
      },
    });

    if (!privateChat) handleMissingPermissions(ctx);

    trackEvent("settings.autoexpand.enable");

    return;
  }
}
