import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { changelogSettingsTemplate, safeSendMessage } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { isBanned } from "../helpers/banned";
import { checkAdminStatus } from "../helpers/admin";
import { logger } from "../helpers/logger";

/**
 * Manage changelog settings
 */
bot.command("changelog", async (ctx: Context) => {
  const msg = ctx.update.message;
  const msgId = msg?.message_id;
  const chatId = msg?.chat.id;
  const topicId = ctx.msg?.message_thread_id;

  // Discard malformed messages
  if (!msgId || !chatId) return;
  if (isBanned(chatId)) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    logger.error("Error getting settings: {error}", { error });
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    try {
      return await safeSendMessage(bot.api, chatId, "You need to be an admin to use the Changelog command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      });
    } catch (error) {
      logger.error("Failed to send changelog admin message: {error}", { error });
      return;
    }
  }

  try {
    showBotActivity(ctx, chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control changelog settings
      try {
        await safeSendMessage(bot.api, chatId, changelogSettingsTemplate(settings.changelog), {
          message_thread_id: topicId ?? undefined,
          parse_mode: "MarkdownV2",
          disable_notification: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: settings.changelog ? "❌ Disable" : "✅ Enable",
                  callback_data: `changelog:${settings.changelog ? "off" : "on"}`,
                },
                {
                  text: "✨ Done",
                  callback_data: "changelog:done",
                },
              ],
            ],
          },
        });
      } catch (error) {
        logger.error("Failed to send changelog settings message: {error}", { error });
        return;
      }
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      try {
        await createSettings(chatId, false, true, false);
      } catch (error) {
        logger.error("Error creating settings: {error}", { error });
      }
      // Reply with template and buttons to control changelog settings (default: on)
      try {
        await safeSendMessage(ctx.api, chatId, changelogSettingsTemplate(true), {
          message_thread_id: topicId ?? undefined,
          parse_mode: "MarkdownV2",
          disable_notification: true,
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
        });
      } catch (error) {
        logger.error("Failed to send default changelog settings message: {error}", { error });
        return;
      }
    }
  } catch (error) {
    logger.error("Failed to process changelog command: {error}", { error });

    // @ts-ignore
    if (error.description.includes("was blocked")) {
      notifyAdmin(chatId);
    }
    return;
  }

  trackEvent("command.changelog");
});
