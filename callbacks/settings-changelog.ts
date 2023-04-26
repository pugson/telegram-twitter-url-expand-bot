import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { updateSettings } from "../helpers/api";
import { changelogSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";

const FIELD_NAME = "changelog";

/**
 * Handle button responses to /changelog
 * @param ctx Telegram context
 */
export async function handleChangelogSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  if (data.includes("changelog:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("changelog:off")) {
    updateSettings(chatId, FIELD_NAME, false);
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    await ctx.api.editMessageText(chatId, messageId, changelogSettingsTemplate(false), {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Enable",
              callback_data: `changelog:on`,
            },
            {
              text: "✨ Done",
              callback_data: "changelog:done",
            },
          ],
        ],
      },
    });

    trackEvent("settings.changelog.disable");
    return;
  }

  if (data.includes("changelog:on")) {
    updateSettings(chatId, FIELD_NAME, true);
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, changelogSettingsTemplate(true), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "❌ Disable",
                callback_data: `changelog:off`,
              },
              {
                text: "✨ Done",
                callback_data: "changelog:done",
              },
            ],
          ],
        },
      })
      .catch(() => {
        console.error(`[Error] Cannot edit chanegelog settings.`);
        return;
      });

    trackEvent("settings.changelog.enable");
    return;
  }
}
