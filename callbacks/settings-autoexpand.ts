import { Context } from "grammy";
import { trackEvent } from "../helpers/analytics";
import { getSettings, updateSettings } from "../helpers/api";
import { autoexpandSettingsTemplate } from "../helpers/templates";
import { deleteMessage } from "../actions/delete-message";
import { handleMissingPermissions } from "../actions/missing-permissions";
import { checkAdminStatus } from "../helpers/admin";

const FIELD_NAME = "autoexpand";

/**
 * Handle button responses to /autoexpand
 * @param ctx Telegram context
 */
export async function handleAutoexpandSettings(ctx: Context) {
  const answer = ctx.update?.callback_query;
  const chatId = answer?.message?.chat.id;
  const messageId = answer?.message?.message_id;
  const data = answer?.data;
  const privateChat = answer?.message?.chat.type === "private";

  // Discard malformed messages
  if (!answer || !chatId || !messageId || !data) return;

  // Only process autoexpand callbacks
  if (!data.includes("autoexpand:")) return;

  let settings, isAdmin;
  try {
    [settings, isAdmin] = await Promise.all([getSettings(chatId), checkAdminStatus(ctx)]);
  } catch (error) {
    console.error("Error getting settings:", error);
    return;
  }
  if (!isAdmin && settings?.settings_lock) {
    // return await ctx.reply("You need to be an admin to change Autoexpand settings.").catch(() => {
    console.error(`[Error] [settings-autoexpand.ts:28] Failed to send message.`);
    return;
    // });
  }

  if (data.includes("autoexpand:done")) {
    await ctx.answerCallbackQuery().catch(() => {
      console.error(`[Error] Cannot answer callback query.`);
      return;
    });
    deleteMessage(chatId, messageId);
    return;
  }

  if (data.includes("autoexpand:off")) {
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
      .editMessageText(chatId, messageId, autoexpandSettingsTemplate(false), {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Enable",
                callback_data: `autoexpand:on`,
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
        console.error(`[Error1]`);
        return;
      });

    trackEvent("settings.autoexpand.disable");
    return;
  }

  if (data.includes("autoexpand:on")) {
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
      .editMessageText(chatId, messageId, autoexpandSettingsTemplate(true), {
        parse_mode: "MarkdownV2",
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
        console.error(`[Error] Cannot edit settings.`);
        return;
      });

    if (!privateChat) handleMissingPermissions(ctx);

    trackEvent("settings.autoexpand.enable");
    return;
  }
}
