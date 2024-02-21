import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { autoexpandSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { Context } from "grammy";
import { handleMissingPermissions } from "../actions/missing-permissions";
import { trackEvent } from "../helpers/analytics";
import { isBanned } from "../helpers/banned";
import { checkAdminStatus } from "../helpers/admin";

/**
 * Manage autoexpand settings
 */
bot.command("autoexpand", async (ctx: Context) => {
  const msg = ctx.update.message;
  const msgId = msg?.message_id;
  const chatId = msg?.chat.id;
  const privateChat = msg?.chat.type === "private";
  const topicId = ctx.msg?.message_thread_id;

  // Discard malformed messages
  if (!msgId || !chatId) return;
  if (isBanned(chatId)) return;

  const [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  if (!isAdmin && settings?.settings_lock) {
    return await bot.api
      .sendMessage(chatId, "You need to be an admin to use the Autoexpand command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      })
      .catch(() => {
        console.error(`[Error] [autoexpand.ts:37] Failed to send message.`);
        return;
      });
  }

  try {
    showBotActivity(ctx, chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control autoexpand settings
      await bot.api
        .sendMessage(chatId, autoexpandSettingsTemplate(settings.autoexpand), {
          message_thread_id: topicId ?? undefined,
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
        })
        .catch(() => {
          console.error(`[Error] [autoexpand.ts:51] Failed to send autoexpand settings template.`);
          return;
        });

      if (settings.autoexpand && !privateChat) {
        handleMissingPermissions(ctx);
      }
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      createSettings(chatId, true, true, false);
      // Reply with template and buttons to control autoexpand settings (default: on)
      await ctx.api
        .sendMessage(chatId, autoexpandSettingsTemplate(true), {
          message_thread_id: topicId ?? undefined,
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
        })
        .catch(() => {
          console.error(`[Error] [autoexpand.ts:85] Failed to send autoexpand settings template.`);
          return;
        });

      if (!privateChat) handleMissingPermissions(ctx);
    }
  } catch (error: any) {
    console.error(error);
    notifyAdmin(error);
  }

  trackEvent("command.autoexpand");
});
