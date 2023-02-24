import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { changelogMessageTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";

/**
 * Manage changelog settings
 */
bot.command("changelog", async (ctx: Context) => {
  const msg = ctx.update.message;
  const msgId = msg?.message_id;
  const chatId = msg?.chat.id;

  // Discard malformed messages
  if (!msgId || !chatId) return;

  showBotActivity(chatId);

  try {
    // Get changelog settings for this chat
    const settings = await getSettings(chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control changelog settings
      await bot.api.sendMessage(chatId, changelogMessageTemplate(settings.changelog), {
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
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, false, true);
      // Reply with template and buttons to control changelog settings (default: on)
      await ctx.api.sendMessage(chatId, changelogMessageTemplate(true), {
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
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
});
