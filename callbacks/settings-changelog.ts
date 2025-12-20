import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { changelogSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { checkAdminStatus } from "../helpers/admin";
import { logger } from "../helpers/logger";

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

  // Only process changelog callbacks
  if (!data.includes("changelog:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    logger.error("Error getting settings: {error}", { error });
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Changelog settings.").catch(() => {
    logger.error("Non-admin tried to change locked changelog settings");
    return;
    // });
  }

  if (data.includes("changelog:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer changelog done callback query");
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("changelog:off")) {
    try {
      await updateSettings(chatId, FIELD_NAME, false);
    } catch (error) {
      logger.error("Error updating changelog settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer changelog off callback query");
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
      logger.error("Error updating changelog settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer changelog on callback query");
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
        logger.error("Cannot edit changelog on message");
        return;
      });

    trackEvent("settings.changelog.enable");
    return;
  }
}
