import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { lockSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { checkAdminStatus } from "../helpers/admin";

const FIELD_NAME = "settings_lock";

/**
 * Handle button responses to /autoexpand
 * @param ctx Telegram context
 */
export async function handleLockSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  // Only process lock callbacks
  if (!data.includes("lock:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    console.error("Error getting settings:", error);
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Lock settings.").catch(() => {
    console.error(`[Error] [settings-lock.ts:26] Failed to send message.`);
    return;
    // });
  }

  if (data.includes("lock:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("lock:off")) {
    try {
      await updateSettings(chatId, FIELD_NAME, false);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, lockSettingsTemplate(false), {
        parse_mode: "MarkdownV2",
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
        console.error(`[Error1]`);
        return;
      });

    trackEvent("settings.lock.disable");
    return;
  }

  if (data.includes("lock:on")) {
    try {
      await updateSettings(chatId, FIELD_NAME, true);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    await ctx.api
      .editMessageText(chatId, messageId, lockSettingsTemplate(true), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔓 Unlock",
                callback_data: `lock:off`,
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
        console.error(`[Error] Cannot edit settings.`);
        return;
      });

    trackEvent("settings.lock.enable");
    return;
  }
}
