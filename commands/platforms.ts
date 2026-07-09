import { bot } from "..";
import { Context } from "grammy";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { platformsSettingsTemplate, safeSendMessage } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { trackEvent } from "../helpers/analytics";
import { isBanned } from "../helpers/banned";
import { checkAdminStatus } from "../helpers/admin";
import { platformsSettingsKeyboard } from "../callbacks/settings-platforms";
import { logger } from "../helpers/logger";

/**
 * Manage which platforms get their links expanded in this chat
 */
bot.command("platforms", async (ctx: Context) => {
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
      return await safeSendMessage(bot.api, chatId, "You need to be an admin to use the Platforms command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      });
    } catch (error) {
      logger.error("Failed to send platforms admin message: {error}", { error });
      return;
    }
  }

  try {
    showBotActivity(ctx, chatId);
    deleteMessage(chatId, msgId);

    // Create default settings for this chat if they don't exist
    if (!settings) {
      try {
        settings = await createSettings(chatId, false, true, false);
      } catch (error) {
        logger.error("Error creating settings: {error}", { error });
      }
    }

    const disabled = settings?.disabled_platforms ?? [];

    // Reply with template and toggle buttons for each platform
    try {
      await safeSendMessage(bot.api, chatId, platformsSettingsTemplate(disabled.length), {
        message_thread_id: topicId ?? undefined,
        parse_mode: "MarkdownV2",
        disable_notification: true,
        reply_markup: {
          inline_keyboard: platformsSettingsKeyboard(disabled),
        },
      });
    } catch (error) {
      logger.error("Failed to send platforms settings message: {error}", { error });
      return;
    }
  } catch (error) {
    logger.error("Failed to process platforms command: {error}", { error });

    // @ts-ignore
    if (error.description.includes("was blocked")) {
      notifyAdmin(chatId);
      return;
    }
    return;
  }

  trackEvent("command.platforms");
});
