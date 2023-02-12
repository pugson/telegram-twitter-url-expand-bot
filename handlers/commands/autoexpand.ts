import { bot } from "../..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../../helpers/api";
import { notifyAdmin } from "../../helpers/notifier";
import { autoexpandMessageTemplate, permissionToDeleteMessageTemplate } from "../../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";

/**
 * Manage autoexpand settings
 */
bot.command("autoexpand", async (ctx: Context) => {
  const msg = ctx.update.message;
  const msgId = msg?.message_id;
  const chatId = msg?.chat.id;

  // Discard malformed messages
  if (!msgId || !chatId) return;

  showBotActivity(chatId);

  try {
    // Get autoexpand settings for this chat
    const settings = await getSettings(chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control autoexpand settings
      await bot.api.sendMessage(chatId, autoexpandMessageTemplate(settings.autoexpand), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: settings.autoexpand ? "❌ Disable" : "✅ Enable",
                callback_data: `autoexpand:${settings.autoexpand ? "off" : "on"}`,
              },
              {
                text: "✨ Done",
                callback_data: "autoexpand:done",
              },
            ],
          ],
        },
      });
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, true);
      // Reply with template and buttons to control autoexpand settings (default: on)
      await ctx.api.sendMessage(chatId, autoexpandMessageTemplate(true), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
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
      });

      // TODO: if bot does not have permission to delete messages
      await ctx.reply(permissionToDeleteMessageTemplate);
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
});
