import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { lockSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { checkAdminStatus } from "../helpers/admin";
import { logger } from "../helpers/logger";

const FIELD_NAME = "settings_lock";

/**
 * Handle button responses to /autoexpand
 * @param ctx Telegram context
 */
export async function handleLockSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  // Only process lock callbacks
  if (!data.includes("lock:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    logger.error("Error getting settings: {error}", { error });
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Lock settings.").catch(() => {
    logger.error("Non-admin tried to change locked lock settings");
    return;
    // });
  }

  if (data.includes("lock:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer lock done callback query");
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("lock:off")) {
    try {
      await updateSettings(chatId, FIELD_NAME, false);
    } catch (error) {
      logger.error("Error updating lock settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer lock off callback query");
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, lockSettingsTemplate(false), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔒 Lock",
                callback_data: `lock:on`,
              },
              {
                text: "✨ Done",
                callback_data: "lock:done",
              },
            ],
          ],
        },
      })
      .catch(() => {
        logger.error("Cannot edit lock off message");
        return;
      });

    trackEvent("settings.lock.disable");
    return;
  }

  if (data.includes("lock:on")) {
    try {
      await updateSettings(chatId, FIELD_NAME, true);
    } catch (error) {
      logger.error("Error updating lock settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer lock on callback query");
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, lockSettingsTemplate(true), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔓 Unlock",
                callback_data: `lock:off`,
              },
              {
                text: "✨ Done",
                callback_data: "lock:done",
              },
            ],
          ],
        },
      })
      .catch(() => {
        logger.error("Cannot edit lock on message");
        return;
      });

    trackEvent("settings.lock.enable");
    return;
  }
}
