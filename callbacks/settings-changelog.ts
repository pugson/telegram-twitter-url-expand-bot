import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { changelogSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { checkAdminStatus } from "../helpers/admin";

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

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    console.error("Error getting settings:", error);
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Changelog settings.").catch(() => {
    console.error(`[Error] [settings-changelog.ts:26] Failed to send message.`);
    return;
    // });
  }

  if (data.includes("changelog:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("changelog:off")) {
    try {
      await updateSettings(chatId, FIELD_NAME, false);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
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
    try {
      await updateSettings(chatId, FIELD_NAME, true);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
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
