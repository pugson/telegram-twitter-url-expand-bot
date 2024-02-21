import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { lockSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { isBanned } from "../helpers/banned";
import { checkAdminStatus } from "../helpers/admin";

/**
 * Manage locking settings
 */
bot.command("lock", async (ctx: Context) => {
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
      .sendMessage(chatId, "You need to be an admin to use the Lock command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      })
      .catch(() => {
        console.error(`[Error] [lock.ts:35] Failed to send message.`);
        return;
      });
  }

  try {
    showBotActivity(ctx, chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control changelog settings
      await bot.api
        .sendMessage(chatId, lockSettingsTemplate(settings.settings_lock), {
          message_thread_id: topicId ?? undefined,
          parse_mode: "MarkdownV2",
          disable_notification: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: settings.settings_lock ? "🔓 Unlock" : "🔒 Lock",
                  callback_data: `lock:${settings.settings_lock ? "off" : "on"}`,
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
          console.error(`[Error] [changelog.ts:51] Failed to send settings_lock template.`);
          return;
        });
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, false, true, false);
      // Reply with template and buttons to control settings_lock (default: off)
      await ctx.api
        .sendMessage(chatId, lockSettingsTemplate(true), {
          message_thread_id: topicId ?? undefined,
          parse_mode: "MarkdownV2",
          disable_notification: true,
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
          console.error(`[Error] [changelog.ts:79] Failed to send changelog settings template.`);
          return;
        });
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
    return;
  }

  trackEvent("command.lock");
});
