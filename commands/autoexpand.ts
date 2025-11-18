import { bot } from "..";
import { showBotActivity } from "../actions/show-bot-activity";
import { createSettings, getSettings } from "../helpers/api";
import { notifyAdmin } from "../helpers/notifier";
import { autoexpandSettingsTemplate, safeSendMessage } from "../helpers/templates";
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

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    console.error("Error getting settings:", error);
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    try {
      return await safeSendMessage(bot.api, chatId, "You need to be an admin to use the Autoexpand command.", {
        message_thread_id: topicId ?? undefined,
        disable_notification: true,
      });
    } catch (error) {
      console.error(`[Error] [autoexpand.ts:37] Failed to send message.`, error);
      return;
    }
  }

  try {
    showBotActivity(ctx, chatId);

    if (settings) {
      deleteMessage(chatId, msgId);
      // Reply with template and buttons to control autoexpand settings
      try {
        await safeSendMessage(bot.api, chatId, autoexpandSettingsTemplate(settings.autoexpand), {
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
        });
      } catch (error) {
        console.error(`[Error] [autoexpand.ts:60] Failed to send message.`, error);
        return;
      }

      if (settings.autoexpand && !privateChat) {
        handleMissingPermissions(ctx);
      }
    } else {
      deleteMessage(chatId, msgId);
      // Create default settings for this chat
      try {
        await createSettings(chatId, true, true, false);
      } catch (error) {
        console.error("Error creating settings:", error);
      }
      // Reply with template and buttons to control autoexpand settings (default: on)
      try {
        await safeSendMessage(ctx.api, chatId, autoexpandSettingsTemplate(true), {
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
        });
      } catch (error) {
        console.error(`[Error] [autoexpand.ts:88] Failed to send message.`, error);
        return;
      }

      if (!privateChat) handleMissingPermissions(ctx);
    }
  } catch (error) {
    console.error(`[Error] [autoexpand.ts:95] Failed to process autoexpand command.`, error);

    // @ts-ignore
    if (error.description.includes("was blocked")) {
      notifyAdmin(chatId);
      return;
    }

    if (!privateChat) {
      await handleMissingPermissions(ctx);
    }
    return;
  }

  trackEvent("command.autoexpand");
});
