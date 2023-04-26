import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { changelogSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";

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

  try {
    showBotActivity(ctx, chatId);
    // Get changelog settings for this chat
    const settings = await getSettings(chatId);

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
      createSettings(chatId, false, true);
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
