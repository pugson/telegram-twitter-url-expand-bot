import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { autoexpandSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { handleMissingPermissions } from "../actions/missing-permissions";

/**
 * Manage autoexpand settings
 */
bot.command("autoexpand", async (ctx: Context) => {
  const msg = ctx.update.message;
  const msgId = msg?.message_id;
  const chatId = msg?.chat.id;
  const privateChat = msg?.chat.type === "private";

  // Discard malformed messages
  if (!msgId || !chatId) return;

  showBotActivity(chatId);

  try {
    // Get autoexpand settings for this chat
    const settings = await getSettings(chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control autoexpand settings
      await bot.api.sendMessage(chatId, autoexpandSettingsTemplate(settings.autoexpand), {
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

      if (settings.autoexpand && !privateChat) {
        handleMissingPermissions(ctx);
      }
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, true, true);
      // Reply with template and buttons to control autoexpand settings (default: on)
      await ctx.api.sendMessage(chatId, autoexpandSettingsTemplate(true), {
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

      if (!privateChat) handleMissingPermissions(ctx);
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }
});
