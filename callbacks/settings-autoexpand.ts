import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { autoexpandSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { handleMissingPermissions } from "../actions/missing-permissions";
import { checkAdminStatus } from "../helpers/admin";
import { logger } from "../helpers/logger";

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

  // Only process autoexpand callbacks
  if (!data.includes("autoexpand:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    logger.error("Error getting settings: {error}", { error });
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Autoexpand settings.").catch(() => {
    logger.error("Non-admin tried to change locked autoexpand settings");
    return;
    // });
  }

  if (data.includes("autoexpand:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer autoexpand done callback query");
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("autoexpand:off")) {
    try {
      await updateSettings(chatId, FIELD_NAME, false);
    } catch (error) {
      logger.error("Error updating autoexpand settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer autoexpand off callback query");
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, autoexpandSettingsTemplate(false), {
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
      })
      .catch(() => {
        logger.error("Cannot edit autoexpand off message");
        return;
      });

    trackEvent("settings.autoexpand.disable");
    return;
  }

  if (data.includes("autoexpand:on")) {
    try {
      await updateSettings(chatId, FIELD_NAME, true);
    } catch (error) {
      logger.error("Error updating autoexpand settings: {error}", { error });
    }
    await ctx.answerCallbackQuery().catch(() => {
      logger.error("Cannot answer autoexpand on callback query");
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, autoexpandSettingsTemplate(true), {
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
      })
      .catch(() => {
        logger.error("Cannot edit autoexpand on message");
        return;
      });

    if (!privateChat) handleMissingPermissions(ctx);

    trackEvent("settings.autoexpand.enable");
    return;
  }
}
