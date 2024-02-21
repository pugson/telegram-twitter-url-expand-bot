import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { changelogSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { isBanned } from "../helpers/banned";
import { checkAdminStatus } from "../helpers/admin";

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

  const [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  if (!isAdmin && settings?.settings_lock) {
    return await bot.api
      .sendMessage(chatId, "You need to be an admin to use the Changelog command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      })
      .catch(() => {
        console.error(`[Error] [changelog.ts:34] Failed to send message.`);
        return;
      });
  }

  try {
    showBotActivity(ctx, chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control changelog settings
      await bot.api
        .sendMessage(chatId, changelogSettingsTemplate(settings.changelog), {
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
        })
        .catch(() => {
          console.error(`[Error] [changelog.ts:51] Failed to send changelog settings template.`);
          return;
        });
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, false, true, false);
      // Reply with template and buttons to control changelog settings (default: on)
      await ctx.api
        .sendMessage(chatId, changelogSettingsTemplate(true), {
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
        })
        .catch(() => {
          console.error(`[Error] [changelog.ts:79] Failed to send changelog settings template.`);
          return;
        });
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
    return;
  }

  trackEvent("command.changelog");
});
